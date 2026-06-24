#!/usr/bin/env python3
"""
Pipeline canonique d'enrichissement des usages MathAData (Capytale).
Source par défaut : public/data/capytale_fresh_20260619.csv.
Override : variable MATHADATA_CAPYTALE_CSV.
Produit des tables canoniques exploitables par tous les analystes.
"""
import pandas as pd, numpy as np, json, os

import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
BASE = f"{_RT}/public/data"
OUT  = f"{_ENQ}/usage-capytale/data"
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- activités
ACT = {
 '3518185': ('Statistiques – classif. chiffres', '2nde', 'Statistiques'),
 '2548348': ('Intro IA – chiffres 2 et 7',       '2nde', 'IA (intro)'),
 '3515488': ('Équation réduite de droite',       '2nde', 'Géométrie'),
 '6944347': ('Statistiques – santé fœtus',       '2nde', 'Statistiques'),
 '6659633': ('Géométrie repérée (milieu/dist.)', '2nde', 'Géométrie'),
 '5862412': ('Droite & produit scalaire',        '1ere', 'Géométrie'),
 '8790616': ('Équation cartésienne',             '2nde', 'Géométrie'),
 '5909323': ('Challenge IA – réseau neurones',   'Lycée','Challenge IA'),
 '3534169': ('Challenge MNIST – meilleur pixel',  'BTS/NSI','Challenge IA'),
 '9747648': ('Prototype équation réduite',       '2nde', 'Géométrie'),
 '5197770': ('MathAData in English – geometry',  'Lycée','Géométrie (EN)'),
 '4388355': ('Séance Python – MNIST',            'Lycée','IA (intro)'),
}

# ---------------------------------------------------------------- chargement
df = pd.read_csv(K.capytale_csv(), dtype=str, keep_default_na=False)
for c in df.columns:
    df[c] = df[c].astype(str).str.strip()
df['role'] = df['role'].str.lower().replace({'nan':''})
df['created_dt'] = pd.to_datetime(pd.to_numeric(df['created'], errors='coerce'), unit='s', utc=True)
df['changed_dt'] = pd.to_datetime(pd.to_numeric(df['changed'], errors='coerce'), unit='s', utc=True)
df['created_dt'] = df['created_dt'].dt.tz_convert('Europe/Paris')
df['changed_dt'] = df['changed_dt'].dt.tz_convert('Europe/Paris')

def school_year(d):
    return K.school_year(d)   # impl unique (socle K, coupure 1ᵉʳ août — GLOSSAIRE §1)
df['sy']   = df['created_dt'].apply(school_year)
df['ym']   = df['created_dt'].dt.strftime('%Y-%m')
df['date'] = df['created_dt'].dt.date.astype(str)
df['act_label'] = df['mathadata_id'].map(lambda x: ACT.get(x,(x,'?','?'))[0])
df['act_level'] = df['mathadata_id'].map(lambda x: ACT.get(x,(x,'?','?'))[1])
df['act_theme'] = df['mathadata_id'].map(lambda x: ACT.get(x,(x,'?','?'))[2])

# ---------------------------------------------------------------- annuaire
ann = pd.read_csv(f"{BASE}/annuaire_etablissements.csv", dtype=str, keep_default_na=False)
ann['ips_num'] = pd.to_numeric(ann['ips'], errors='coerce')
ann_idx = ann.set_index('uai')
def lookup(uai, field):
    if uai and uai in ann_idx.index:
        v = ann_idx.at[uai, field]
        return v if not isinstance(v, pd.Series) else v.iloc[0]
    return ''
# enrich student establishment (uai_el) and teacher establishment (uai_teach)
for src,pref in [('uai_el','el'),('uai_teach','th')]:
    for f in ['type_etablissement','secteur','academie','departement','commune','nom','ips_num','latitude','longitude']:
        df[f'{pref}_{f}'] = df[src].map(lambda u: lookup(u, f))

# ---------------------------------------------------------------- prof -> établissement de référence
# Pour chaque teacher id : UAI prof = uai_teach modal (non vide) sinon uai_el modal des rows student
def modal_nonempty(s):
    s = s[s.astype(str).str.strip()!='']
    return s.mode().iloc[0] if len(s) else ''
teacher_uai = {}
for tid, g in df.groupby('teacher'):
    u = modal_nonempty(g['uai_teach'])
    if not u:
        u = modal_nonempty(g.loc[g['role']=='student','uai_el'])
    if not u:
        u = modal_nonempty(g['uai_el'])
    teacher_uai[tid] = u
df['teacher_uai'] = df['teacher'].map(teacher_uai)

# ---------------------------------------------------------------- détection de séances
# Séance = run maximal de clones ÉLÈVES (même teacher + même mathadata_id) dont les
# créations consécutives sont espacées de < GAP. UAI_el utilisé pour séparer 2 classes
# d'un même prof le même jour si UAI diffère.
GAP_HOURS = 3.0
stu = df[df['role']=='student'].copy().sort_values('created_dt')
stu['session_id'] = ''
sessions = []
sid = 0
for (tid, mid, uel), g in stu.groupby(['teacher','mathadata_id','uai_el'], sort=False):
    g = g.sort_values('created_dt')
    prev = None; cur = []
    def flush(rows):
        global sid
        if not rows: return
        sid += 1
        ids = [r['assignment_id'] for r in rows]
        stu.loc[stu['assignment_id'].isin(ids),'session_id'] = f"S{sid}"
        times = [r['created_dt'] for r in rows]
        sessions.append(dict(session_id=f"S{sid}", teacher=tid, mathadata_id=mid,
            act_label=ACT.get(mid,(mid,))[0], uai_el=uel,
            n_eleves=len(rows), start=min(times), end=max(times),
            sy=school_year(min(times)), date=str(min(times).date()),
            span_min=(max(times)-min(times)).total_seconds()/60.0))
    for _,r in g.iterrows():
        if prev is not None and (r['created_dt']-prev).total_seconds()/3600.0 > GAP_HOURS:
            flush(cur); cur=[]
        cur.append(r); prev=r['created_dt']
    flush(cur)
sess = pd.DataFrame(sessions)
df = df.merge(stu[['assignment_id','session_id']], on='assignment_id', how='left')
df['session_id'] = df['session_id'].fillna('')

# ---------------------------------------------------------------- table PROFS
rows=[]
for tid, g in df.groupby('teacher'):
    gt = g[g['role']=='teacher']      # tests du prof
    gs = g[g['role']=='student']      # élèves distribués par le prof
    ge = g[g['role']=='']
    uai = teacher_uai[tid]
    first_test  = gt['created_dt'].min() if len(gt) else pd.NaT
    first_stud  = gs['created_dt'].min() if len(gs) else pd.NaT
    last_any    = g['created_dt'].max()
    first_any   = g['created_dt'].min()
    tested = len(gt)>0
    taught = len(gs)>0
    if taught and tested:
        behavior = 'testé_puis_enseigné' if first_test <= first_stud else 'enseigné_puis_testé'
    elif taught and not tested:
        behavior = 'enseigné_sans_test'
    elif tested and not taught:
        behavior = 'testé_seulement'
    else:
        behavior = 'role_vide_seulement'
    sy_active = sorted(set(g['sy']) - {'NA'})
    sy_taught = sorted(set(gs['sy']) - {'NA'})
    n_sess = g[g['session_id']!='']['session_id'].nunique()
    rows.append(dict(
        teacher=tid, uai=uai,
        type_etab=lookup(uai,'type_etablissement'), secteur=lookup(uai,'secteur'),
        academie=lookup(uai,'academie'), departement=lookup(uai,'departement'),
        commune=lookup(uai,'commune'), nom_etab=lookup(uai,'nom'),
        ips=lookup(uai,'ips_num'), lat=lookup(uai,'latitude'), lon=lookup(uai,'longitude'),
        n_tests=len(gt), n_eleves=len(gs), n_eleves_uniq=gs['student'].nunique(),
        n_sessions=n_sess, n_activities=g['mathadata_id'].nunique(),
        n_activities_taught=gs['mathadata_id'].nunique(),
        tested=tested, taught=taught, behavior=behavior,
        first_any=first_any, last_any=last_any,
        first_test=first_test, first_student=first_stud,
        days_test_to_teach=((first_stud-first_test).total_seconds()/86400.0 if (tested and taught) else np.nan),
        n_sy_active=len(sy_active), sy_active='|'.join(sy_active),
        n_sy_taught=len(sy_taught), sy_taught='|'.join(sy_taught),
        active_2324='2023-2024' in sy_active, active_2425='2024-2025' in sy_active, active_2526='2025-2026' in sy_active,
        taught_2425='2024-2025' in sy_taught, taught_2526='2025-2026' in sy_taught,
    ))
teachers = pd.DataFrame(rows)

# ---------------------------------------------------------------- table ÉTABLISSEMENTS (par UAI prof de référence)
erows=[]
for uai, g in teachers[teachers['uai']!=''].groupby('uai'):
    erows.append(dict(
        uai=uai, nom=lookup(uai,'nom'), type_etab=lookup(uai,'type_etablissement'),
        secteur=lookup(uai,'secteur'), academie=lookup(uai,'academie'),
        departement=lookup(uai,'departement'), commune=lookup(uai,'commune'),
        ips=lookup(uai,'ips_num'), lat=lookup(uai,'latitude'), lon=lookup(uai,'longitude'),
        n_profs=g['teacher'].nunique(),
        n_profs_taught=int((g['taught']).sum()), n_profs_tested_only=int((g['behavior']=='testé_seulement').sum()),
        n_eleves=int(g['n_eleves'].sum()), n_eleves_uniq=int(g['n_eleves_uniq'].sum()),
        n_sessions=int(g['n_sessions'].sum()), n_tests=int(g['n_tests'].sum()),
        sy_set='|'.join(sorted(set('|'.join(g['sy_active']).split('|'))-{''})),
    ))
estabs = pd.DataFrame(erows)

# ---------------------------------------------------------------- sauvegarde
df.to_csv(f"{OUT}/usages_enriched.csv", index=False)
teachers.to_csv(f"{OUT}/teachers.csv", index=False)
estabs.to_csv(f"{OUT}/establishments.csv", index=False)
sess.to_csv(f"{OUT}/sessions.csv", index=False)

print("usages:", df.shape, "| profs:", teachers.shape, "| etabs:", estabs.shape, "| sessions:", sess.shape)
print("\nBehavior (tous profs):"); print(teachers['behavior'].value_counts())
print("\nProfs avec UAI:", (teachers['uai']!='').sum(), "/", len(teachers))
print("Sessions:", len(sess), "| élèves médian/séance:", sess['n_eleves'].median(), "| moyen:", round(sess['n_eleves'].mean(),1))
print("OK")
