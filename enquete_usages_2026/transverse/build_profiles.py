#!/usr/bin/env python3
"""
COMMONS — couche de calcul CANONIQUE des profils d'usage (prof × année scolaire).

Implémente *strictement* `transverse/GLOSSAIRE.md` (source de vérité des définitions).
C'est ici, et nulle part ailleurs, que naissent les variables dérivées :
  - AXE 1 — profondeur d'usage atteinte dans l'année (escalier 0-5, intra-annuel)
  - AXE 2 — canal d'arrivée (2 valeurs : via_site / capytale_direct), FIGÉ à la 1ʳᵉ apparition
  - Formation × timing (jamais / motrice / consolidation) — orthogonal au canal
  - Rétention ENTRE années : retour consécutif vs réactivation vs censuré (jamais dans l'axe 1)
  - Niveau (collège / lycée)

Refactor : consolide la logique jusque-là éparpillée (volet1 `build_canonical`, volet2
`build_payload_canonical`, et les scripts ad hoc du scratchpad « door / trajectoires »)
en UN module documenté et reproductible.

ENTRÉES (déjà canoniques) :
  - usage-capytale/data/usages_enriched.csv, sessions.csv, teachers.csv   (Capytale, versionné)
  - site-vers-classe/data/match_candidates.csv                             (75 paires, versionné, sans PII)
  - <scratch>/payload_users_work.csv                             (site, id-only, LOCAL via build_payload_canonical.py)
  - <scratch>/match_nominatif.csv                                (pont site_code→site_id, LOCAL/PII — lu, jamais écrit)
  - snapshot etablissements.json                                 (type collège/lycée, LOCAL)

SORTIES (PII-free, versionnées dans transverse/data/) :
  - profiles_teacher_year.csv   1 ligne = (prof md5[:8] × année) : niveau de profondeur + compteurs
  - profiles_teacher.csv        1 ligne = prof : canal, formation, niveau, rétention, 1ʳᵉ année classe…
  - facts_profiles.json         agrégats (source de vérité des chiffres du dashboard Flux)

Sécurité : aucune sortie ne contient nom/prénom/e-mail. Le prof est pseudonymisé en md5[:8].
"""
import pandas as pd, numpy as np, json, os
from datetime import timedelta

import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
ROOT = _RT
V1   = f"{ROOT}/enquete_usages_2026/usage-capytale/data"
V2   = f"{ROOT}/enquete_usages_2026/site-vers-classe/data"
OUT  = f"{ROOT}/enquete_usages_2026/transverse/data"
SCRATCH=_os.environ.get("MATHADATA_LOCAL", f"{_ENQ}/_local")  # ex-scratch session -> dossier local stable (gitignore)
SNAP = _os.environ.get("MATHADATA_SNAPSHOT", f"{_WS}/mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z")
os.makedirs(OUT, exist_ok=True)

DEMO, PIO = K.DEMO, K.PIO                                   # socle partagé (GLOSSAIRE §2)
CLASSE_MIN = K.CLASSE_MIN                                   # seuil "classe" (≥5 él.) — GLOSSAIRE §3
DEMI_LO, DEMI_HI, DEMI_DAYS = K.DEMI_LO, K.DEMI_HI, K.DEMI_DAYS
LAST_OBSERVED_SY = K.LAST_OBSERVED_SY

def h8(md5): return md5[:8]
def sy_int(s):  # "2024-2025" -> 2024 (année de septembre)
    return int(s.split('-')[0]) if s and s!='NA' else None

# ───────────────────────────── 1. Chargement Capytale canonique ─────────────────────────────
use  = pd.read_csv(f"{V1}/usages_enriched.csv", dtype=str, keep_default_na=False)
sess = pd.read_csv(f"{V1}/sessions.csv", dtype=str, keep_default_na=False)
tea  = pd.read_csv(f"{V1}/teachers.csv", dtype=str, keep_default_na=False)

use['created_dt'] = pd.to_datetime(use['created_dt'], errors='coerce', utc=True)
sess['start'] = pd.to_datetime(sess['start'], errors='coerce', utc=True)
sess['n_eleves'] = pd.to_numeric(sess['n_eleves'], errors='coerce').fillna(0).astype(int)
tea['first_student'] = pd.to_datetime(tea['first_student'], errors='coerce', utc=True)
tea['first_test']    = pd.to_datetime(tea['first_test'], errors='coerce', utc=True)

# population canonique côté Capytale (escalier 2-5, glossaire §4), hors démo & hub fondateur :
#   - profs ayant touché des élèves (taught → niveaux 3-5) ;
#   - testeurs purs (tested & !taught → niveau 2 : auto-clone, 0 élève).
tea = tea[((tea['taught']=='True') | (tea['tested']=='True')) & (~tea['teacher'].isin([DEMO, PIO]))].copy()
POP = set(tea['teacher'])
n_touched = int((tea['taught']=='True').sum())
print(f"Population Capytale 2-5 (hub+démo exclus) : {len(POP)}  (dont {n_touched} ont touché des élèves, {len(POP)-n_touched} testeurs purs)")

# ───────────────────────────── 2. Niveau collège/lycée ─────────────────────────────
ref = json.load(open(f"{SNAP}/etablissements.json"))
REF_TYPE = {e['uai']: e.get('type','') for e in ref}   # college | lycee, 13040 UAI
def niveau(uai, type_etab):
    t = (REF_TYPE.get(uai,'') or type_etab or '').lower()
    if 'col' in t:  return 'college'
    if 'lyc' in t:  return 'lycee'
    return 'inconnu'
tea['niveau'] = [niveau(u, t) for u,t in zip(tea['uai'], tea['type_etab'])]

# ───────────────────────────── 3. AXE 1 — profondeur par (prof × année) ─────────────────────────────
def count_occasions(classes):
    """classes = liste de (date, n_eleves) des séances ≥5 él. d'un prof une année.
    Occasion = activité distincte ; demi-groupes (même activité, chacun 5-15 él., gaps <10j)
    fusionnés en 1. Ici on reçoit déjà les séances d'UNE activité → renvoie le nb d'occasions."""
    if not classes: return 0
    classes = sorted(classes, key=lambda x: x[0])
    occ = 1
    prev_date, prev_n = classes[0]
    for d, n in classes[1:]:
        same_demi = (DEMI_LO <= n <= DEMI_HI) and (DEMI_LO <= prev_n <= DEMI_HI)
        within = (d - prev_date) < timedelta(days=DEMI_DAYS)
        if not (same_demi and within):
            occ += 1
        prev_date, prev_n = d, n
    return occ

# sessions élèves par prof×année (déjà = clusters élèves)
sess_pop = sess[sess['teacher'].isin(POP)].copy()
# rôle=teacher (auto-tests) par prof×année
selftest = use[(use['role']=='teacher') & (use['teacher'].isin(POP))].copy()
selftest['sy'] = selftest['sy']
st_years = selftest.groupby(['teacher','sy']).size().to_dict()
# élèves (role=student) par prof×année — pour distinguer niveau 3 (a des élèves) du niveau 2
stud = use[(use['role']=='student') & (use['teacher'].isin(POP))]
stud_years = stud.groupby(['teacher','sy']).size().to_dict()

rows = []
# années où le prof a des séances élèves
for (tid, sy), g in sess_pop.groupby(['teacher','sy']):
    classes = g[g['n_eleves'] >= CLASSE_MIN]
    # occasions = somme sur activités
    n_occ = 0
    for mid, ga in classes.groupby('mathadata_id'):
        n_occ += count_occasions(list(zip(ga['start'], ga['n_eleves'])))
    n_classes = len(classes)
    has_student = stud_years.get((tid,sy), 0) > 0
    has_selftest = st_years.get((tid,sy), 0) > 0
    if   n_occ >= 2: lvl = 5
    elif n_occ == 1: lvl = 4
    elif has_student: lvl = 3          # élèves mais aucune séance ≥5
    elif has_selftest: lvl = 2
    else: lvl = 2                       # garde-fou (séance sans élève ⇒ test)
    rows.append(dict(teacher=h8(tid), teacher_full=tid, sy=sy, level=lvl,
                     n_sessions=len(g), n_classes=n_classes, n_occasions=n_occ,
                     n_eleves=int(g['n_eleves'].sum()),
                     n_activites=int(g['mathadata_id'].nunique()),               # toutes activités (incl. sous-seuil)
                     n_activites_classe=int(classes['mathadata_id'].nunique()),  # activités atteignant une classe ≥5 (pour le prédicteur)
                     self_test=has_selftest))
# années où le prof n'a QUE des auto-tests (aucune séance élève) → niveau 2
seen = {(r['teacher_full'], r['sy']) for r in rows}
for (tid, sy), n in st_years.items():
    if (tid, sy) not in seen and stud_years.get((tid,sy),0)==0:
        rows.append(dict(teacher=h8(tid), teacher_full=tid, sy=sy, level=2,
                         n_sessions=0, n_classes=0, n_occasions=0, n_eleves=0,
                         n_activites=0, n_activites_classe=0, self_test=True))
PY = pd.DataFrame(rows)
PY = PY[PY['sy'] != 'NA'].copy()

# ───────────────────────────── 4. Rétention (entre années, sur niveau ≥4) ─────────────────────────────
def retention(group):
    yrs = sorted({sy_int(s) for s,l in zip(group['sy'], group['level']) if l >= 4})
    if not yrs:
        return dict(n_years_classe=0, first_classe_sy=None, retour_consecutif=False,
                    reactivation=False, revenu=False, censored=False)
    consec = any((y+1) in yrs for y in yrs)
    react  = (len(yrs) >= 2) and not consec
    first  = yrs[0]
    censored = (len(yrs) == 1) and (f"{first}-{first+1}" == LAST_OBSERVED_SY)
    return dict(n_years_classe=len(yrs), first_classe_sy=f"{first}-{first+1}",
                retour_consecutif=consec, reactivation=react,
                revenu=(len(yrs) >= 2), censored=censored)

# ───────────────────────────── 5. AXE 2 — canal + formation (cross-mondes) ─────────────────────────────
# 5a. appariement individuel (75 paires) : cap_acc = md5[:8]
mc = pd.read_csv(f"{V2}/match_candidates.csv", dtype=str, keep_default_na=False)
matched = {r['cap_acc'][:8]: dict(statut=r['statut'], ftype=r['ftype'], site_code=r['site_code'])
           for _,r in mc.iterrows()}
# pont site_code -> site_id (payload) pour récupérer la date de formation (LOCAL, PII non écrite)
nom_path = f"{SCRATCH}/match_nominatif.csv"
sid_of = {}
if os.path.exists(nom_path):
    nm = pd.read_csv(nom_path, dtype=str, keep_default_na=False)
    sid_of = {r['site_code']: r['site_id'] for _,r in nm.iterrows()}

# 5b. table site (payload) : par UAI, comptes formés / actifs + dates
W = pd.read_csv(f"{SCRATCH}/payload_users_work.csv", dtype=str, keep_default_na=False)
W['createdAt'] = pd.to_datetime(W['createdAt'], errors='coerce', utc=True)
W['fdate']     = pd.to_datetime(W['fdate'], errors='coerce', utc=True)
W['first_cap'] = pd.to_datetime(W['first_cap'], errors='coerce', utc=True)
W['is_formed'] = W['is_formed']=='True'
fdate_by_sid   = {r['id']: r['fdate'] for _,r in W.iterrows()}
created_by_sid = {r['id']: r['createdAt'] for _,r in W.iterrows()}   # création du compte site
firstcap_by_sid= {r['id']: r['first_cap'] for _,r in W.iterrows()}   # 1ᵉʳ clic vers Capytale
# par UAI : plus ancienne trace site (création de compte) et existence d'un compte formé + sa date
site_by_uai = {}
for u, g in W[W['uai']!=''].groupby('uai'):
    formed = g[g['is_formed']]
    site_by_uai[u] = dict(
        first_site = g['createdAt'].min(),
        any_clicked = bool((g['clicked_cap']=='True').any()),
        first_formed = formed['fdate'].min() if len(formed) else pd.NaT,
        has_formed = len(formed) > 0)

def classify(tid):
    """Renvoie (canal, canal_src, formation_status, formation_timing, formation_src), FIGÉ à la 1ʳᵉ
    apparition Capytale TOUS MONDES confondus = min(first_test, first_student) (GLOSSAIRE §6 :
    « le canal décrit l'origine ; il inclut le 1ᵉʳ clone Capytale »). Un prof qui a auto-testé sur
    Capytale AVANT tout contact site est arrivé par Capytale, même s'il a créé un compte site ensuite.
    ⚠️ canal_src / formation_src = niveau de confiance : 'individuel' (appariement 1:1, fiable) vs
    'proxy_etab' (un compte/formation d'un COLLÈGUE au même UAI — attribution écologique, prudence)."""
    row = tea[tea['teacher']==tid].iloc[0]
    uai = row['uai']
    # ancre = 1ʳᵉ apparition Capytale (auto-test OU 1ᵉʳ élève), la plus précoce des deux
    _cands = [d for d in (row['first_test'], row['first_student']) if pd.notna(d)]
    first_use = min(_cands) if _cands else pd.NaT
    h = h8(tid)
    canal, fstatut, ftiming = 'capytale_direct', 'jamais', None
    canal_src, fstatut_src = 'aucune', 'aucune'
    fdate = pd.NaT
    grace = timedelta(days=1)
    # (a) apparié individuellement : via_site SEULEMENT si le contact site (création de compte ou
    #     1ᵉʳ clic) est antérieur/simultané au 1ᵉʳ usage élève. Sinon le prof est arrivé par Capytale
    #     puis a créé son compte APRÈS → capytale_direct (le canal décrit l'ORIGINE, cf. glossaire §6).
    if h in matched:                                 # (a) appariement INDIVIDUEL (confiance haute)
        m = matched[h]
        sid = sid_of.get(m['site_code'])
        created = pd.to_datetime(created_by_sid.get(sid), errors='coerce', utc=True) if sid else pd.NaT
        fclick  = pd.to_datetime(firstcap_by_sid.get(sid), errors='coerce', utc=True) if sid else pd.NaT
        site_contact = min([d for d in (created, fclick) if pd.notna(d)], default=pd.NaT)
        if pd.isna(site_contact) or pd.isna(first_use):
            canal = 'via_site'
        elif site_contact <= first_use + grace:
            canal = 'via_site'
        else:
            canal = 'capytale_direct'                # compte site créé APRÈS l'usage → arrivé par Capytale
        canal_src = 'individuel'
        if m['statut'] in ('forme','mentor'):
            fstatut = 'forme'; fstatut_src = 'individuel'
            fd = fdate_by_sid.get(sid) if sid else None
            fdate = pd.to_datetime(fd, errors='coerce', utc=True) if fd else pd.NaT
    else:
        # (b) trace ÉTABLISSEMENT (proxy écologique — un COLLÈGUE au même UAI ; confiance basse)
        s = site_by_uai.get(uai)
        if s is not None and pd.notna(first_use):
            if pd.notna(s['first_site']) and s['first_site'] <= first_use + grace:
                canal = 'via_site'; canal_src = 'proxy_etab'
            if s['has_formed'] and pd.notna(s['first_formed']) and s['first_formed'] <= first_use + grace:
                fstatut = 'forme'; fstatut_src = 'proxy_etab'; fdate = s['first_formed']
                canal = 'via_site'; canal_src = 'proxy_etab'
    # timing de la formation
    if fstatut == 'forme':
        if pd.notna(fdate) and pd.notna(first_use):
            ftiming = 'motrice' if fdate <= first_use + grace else 'consolidation'
        else:
            ftiming = 'motrice' if canal=='via_site' else 'consolidation'
    return canal, canal_src, fstatut, ftiming, fstatut_src

# ───────────────────────────── 6. Table prof (attributs figés + rétention) ─────────────────────────────
prof_rows = []
for tid in POP:
    h = h8(tid)
    g = PY[PY['teacher_full']==tid]
    ret = retention(g)
    canal, canal_src, fstatut, ftiming, fstatut_src = classify(tid)
    row = tea[tea['teacher']==tid].iloc[0]
    prof_rows.append(dict(
        teacher=h, niveau=row['niveau'], canal=canal, canal_source=canal_src,
        formation_statut=fstatut, formation_source=fstatut_src, formation_timing=ftiming,
        max_level=int(g['level'].max()) if len(g) else 2,
        **ret))
PROF = pd.DataFrame(prof_rows)
PY = PY.drop(columns=['teacher_full'])

# ───────────────────────────── 7. Sauvegarde + agrégats ─────────────────────────────
PY.sort_values(['teacher','sy']).to_csv(f"{OUT}/profiles_teacher_year.csv", index=False)
PROF.sort_values('teacher').to_csv(f"{OUT}/profiles_teacher.csv", index=False)

def vc(s): return {str(k): int(v) for k,v in s.value_counts().items()}
# cohorte éligible au retour = a atteint une CLASSE (niveau ≥4, n_years_classe≥1) ET non censurée.
# Les profs "sous-seuil" (niveau 3, jamais de classe ≥5) ne peuvent pas "revenir en classe" → exclus.
reached = PROF[PROF['n_years_classe'] >= 1]
elig = reached[~reached['censored']]
facts = dict(
    population = len(PROF),                                          # toute la pop Capytale 2-5
    n_touched_students = int((PROF['max_level']>=3).sum()),          # 223 (niveaux 3-5)
    testeurs_purs = int((PROF['max_level']==2).sum()),               # 37 (niveau 2)
    seuil_classe = CLASSE_MIN,
    canal = vc(PROF['canal']),
    canal_source = vc(PROF['canal_source']),                         # individuel vs proxy_etab vs aucune
    formation_statut = vc(PROF['formation_statut']),
    formation_source = vc(PROF['formation_source']),
    formation_timing = vc(PROF['formation_timing'].fillna('na')),
    niveau = vc(PROF['niveau']),
    max_level = vc(PROF['max_level']),
    revenus_total = int(PROF['revenu'].sum()),
    retour_consecutif = int(PROF['retour_consecutif'].sum()),
    reactivation = int(PROF['reactivation'].sum()),
    censored = int(reached['censored'].sum()),
    reached_classe = len(reached),
    sous_seuil_only = int((PROF['max_level']==3).sum()),             # 47 (niveau 3, jamais classe ≥5)
    eligibles = len(elig),
    retour_rate_eligible = round(elig['revenu'].mean()*100, 1) if len(elig) else None,
    # déterminants du retour (sur cohorte éligible)
    by_canal = {c: dict(n=int((elig['canal']==c).sum()),
                        revenu=int(elig.loc[elig['canal']==c,'revenu'].sum()))
                for c in elig['canal'].unique()},
    by_formation = {f: dict(n=int((elig['formation_statut']==f).sum()),
                            revenu=int(elig.loc[elig['formation_statut']==f,'revenu'].sum()))
                    for f in elig['formation_statut'].unique()},
)
# réutilisation an-1 (intra-annuel) : niveau de la 1ʳᵉ année classe
def first_year_level(tid_h):
    g = PY[(PY['teacher']==tid_h) & (PY['level']>=4)].sort_values('sy')
    return int(g.iloc[0]['level']) if len(g) else None
PROF['y1_level'] = PROF['teacher'].map(first_year_level)
elig = PROF[(PROF['n_years_classe']>=1) & (~PROF['censored'])]
reuse_y1 = elig[elig['y1_level']==5]; uniq_y1 = elig[elig['y1_level']==4]
facts['reuse_an1'] = dict(
    reutilise_n=len(reuse_y1), reutilise_revenu=int(reuse_y1['revenu'].sum()),
    unique_n=len(uniq_y1),     unique_revenu=int(uniq_y1['revenu'].sum()),
    pct_reutilisent_an1 = round((PROF['y1_level']==5).sum() / PROF['y1_level'].notna().sum()*100,1),
)
# trajectoires pour les diagrammes de flux (sur les profs ayant atteint une CLASSE ≥5)
def devenir(r):
    if r['revenu']: return 'rev'
    if r['censored']: return 'rec'
    return 'non'
R = PROF[PROF['n_years_classe']>=1].copy()
R['dev'] = R.apply(devenir, axis=1)
R['y1b'] = R['y1_level'].map({5:'multi', 4:'uniq'})
# diag 1 : canal → devenir
traj1 = {}
for (c,d), n in R.groupby(['canal','dev']).size().items():
    traj1[f"{c}|{d}"] = int(n)
# diag 2 : canal → profondeur an-1 → devenir
traj2 = {}
for (c,y,d), n in R.groupby(['canal','y1b','dev']).size().items():
    traj2[f"{c}|{y}|{d}"] = int(n)
facts['traj_canal_devenir'] = traj1
facts['traj_canal_y1_devenir'] = traj2
facts['n_reached_classe'] = len(R)

# ───────────────────────────── 7b. Entonnoir canal × formation × profondeur (dashboard Flux) ─────────────────────────────
# Pour les diagrammes « tous les profs » (sans rétention) : on croise les trois attributs FIGÉS
# canal (§6) × formation binaire (§7) × profondeur max atteinte (escalier §4), sur DEUX populations :
#   - touched (223, niveaux 3-5 : ont touché des élèves) ;
#   - all     (260, niveaux 2-5 : + les testeurs purs, qui ont cloné sans distribuer).
# Croisement DESCRIPTIF (canal & formation = estimés ; endogénéité formation×établissement — cf. §7).
DEPTH_LABEL = {2: 'test', 3: 'ss', 4: 'uniq', 5: 'multi'}   # rungs de l'escalier (codes courts pour le JS)
def _funnel(df):
    xt = {}
    for _, r in df.iterrows():
        k = f"{r['canal']}|{r['formation_statut']}|{DEPTH_LABEL[int(r['max_level'])]}"
        xt[k] = xt.get(k, 0) + 1
    def rate(sub):   # n = base ; touched = ≥3 (a distribué) ; classe = ≥4 (a atteint une classe ≥5)
        return dict(n=int(len(sub)),
                    touched=int((sub['max_level'] >= 3).sum()),
                    classe=int((sub['max_level'] >= 4).sum()))
    rates = dict(canal={c: rate(df[df['canal'] == c]) for c in ('via_site', 'capytale_direct')},
                 formation={f: rate(df[df['formation_statut'] == f]) for f in ('forme', 'jamais')})
    return dict(n=int(len(df)), xtab=xt, rates=rates)
facts['funnel'] = dict(
    touched=_funnel(PROF[PROF['max_level'] >= 3]),   # 223 — ont touché des élèves
    all=_funnel(PROF),                                # 260 — l'ensemble des profs Capytale
)
json.dump(facts, open(f"{OUT}/facts_profiles.json","w"), ensure_ascii=False, indent=2)
print("\n=== trajectoires diag1 (canal|devenir) ==="); print(traj1)
print("=== trajectoires diag2 (canal|y1|devenir) ==="); print(traj2)

# ───────────────────────────── 8. Rapport console ─────────────────────────────
print("\n=== AXE 2 — canal (figé) ===");       print(facts['canal'])
print("=== formation statut / timing ===");    print(facts['formation_statut'], facts['formation_timing'])
print("=== niveau ===");                       print(facts['niveau'])
print("=== profondeur max atteinte ===");      print(facts['max_level'])
print(f"\n=== rétention ===\n revenus={facts['revenus_total']} "
      f"(consécutif={facts['retour_consecutif']}, réactivation={facts['reactivation']}), "
      f"censurés={facts['censored']}, éligibles={facts['eligibles']}, "
      f"taux retour éligible={facts['retour_rate_eligible']}%")
print(" par canal:", facts['by_canal'])
print(" par formation:", facts['by_formation'])
print(" réutilisation an-1:", facts['reuse_an1'])
print(f"\n→ {OUT}/profiles_teacher_year.csv  ({len(PY)} lignes prof×année)")
print(f"→ {OUT}/profiles_teacher.csv  ({len(PROF)} profs)")
print(f"→ {OUT}/facts_profiles.json")
