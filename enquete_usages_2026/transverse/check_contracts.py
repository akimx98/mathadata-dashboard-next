#!/usr/bin/env python3
"""Tests de CONTRAT (garde-fous anti-régression) sur les sorties canoniques.
À lancer après toute régénération : `python3 enquete_usages_2026/transverse/check_contracts.py`.
Vérifie : JSON strict (pas de NaN), invariants de population/rétention, pseudonymat (md5[:8]),
absence d'e-mail (PII) dans les CSV versionnés, cohérence canal. Sort en erreur si un contrat casse.
"""
import json, glob, re, sys
import os as _os
import pandas as pd
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
sys.path.insert(0,_ENQ); import enquete_common as K   # socle partagé (populations nommées attendues)
TR=f"{_ENQ}/transverse/data"; V1=f"{_ENQ}/usage-capytale/data"; V2=f"{_ENQ}/site-vers-classe/data"
fails=[]
def check(cond,msg):
    print(("  ✓ " if cond else "  ✗ ")+msg); (fails.append(msg) if not cond else None)

def _raise_const(x): raise ValueError(f"valeur non-stricte: {x}")
def loadstrict(f): return json.loads(open(f,encoding='utf-8').read(), parse_constant=_raise_const)  # rejette NaN/Infinity
print("1. JSON STRICT (rejette réellement NaN/Inf — json.load les accepte par défaut) :")
for f in glob.glob(f"{_ENQ}/**/data/*.json", recursive=True):
    try:
        loadstrict(f); check(True, _os.path.relpath(f,_ENQ))
    except Exception as e:
        check(False, f"{_os.path.relpath(f,_ENQ)} — {e}")

print("2. Invariants profils (facts_profiles.json — escalier 2-5) :")
fp=loadstrict(f"{TR}/facts_profiles.json")
check(fp['n_touched_students']==fp['reached_classe']+fp['sous_seuil_only'], "touché-élèves = atteint-classe + sous-seuil (223 = 176+47)")
check(fp['population']==fp['n_touched_students']+fp['testeurs_purs'], "population 2-5 = touché-élèves + testeurs purs (260 = 223+37)")
check(fp['testeurs_purs']>0 and fp['max_level'].get('2',0)==fp['testeurs_purs'], "testeurs purs (niveau 2) présents dans la couche canonique")
check(sum(fp['canal'].values())==fp['population'], "somme canal = population")
check(sum(fp['traj_canal_devenir'].values())==fp['reached_classe'], "trajectoires1 = profs atteint-classe")
check(fp['eligibles']<=fp['reached_classe'], "éligibles ⊆ atteint-classe")
check(fp['revenus_total']==fp['retour_consecutif']+fp['reactivation'], "revenus = consécutif + réactivation")
check('proxy_etab' in fp['canal_source'], "colonne de provenance canal (individuel/proxy_etab) exposée")
E=K.EXPECT  # populations nommées (enquete_common) = ancrage explicite des effectifs canoniques
check(fp['population']==E['POP_CAPYTALE'], f"population = POP_CAPYTALE ({E['POP_CAPYTALE']})")
check(fp['n_touched_students']==E['POP_TOUCHED'], f"touché-élèves = POP_TOUCHED ({E['POP_TOUCHED']})")
check(fp['reached_classe']==E['POP_CLASSE'], f"atteint-classe = POP_CLASSE ({E['POP_CLASSE']})")
check(fp['testeurs_purs']==E['TESTEURS'] and fp['sous_seuil_only']==E['SOUS_SEUIL'], f"testeurs={E['TESTEURS']} & sous-seuil={E['SOUS_SEUIL']}")
check(fp['eligibles']==E['COHORT_ELIGIBLE'], f"cohorte éligible = COHORT_ELIGIBLE ({E['COHORT_ELIGIBLE']})")

print("2a. Entonnoir canal × formation × profondeur (facts_profiles.funnel — Sankey « tous les profs ») :")
fn=fp['funnel']
check(sum(fn['touched']['xtab'].values())==fn['touched']['n']==E['POP_TOUCHED'], f"funnel touché : Σxtab = n = POP_TOUCHED ({E['POP_TOUCHED']})")
check(sum(fn['all']['xtab'].values())==fn['all']['n']==E['POP_CAPYTALE'], f"funnel tous : Σxtab = n = POP_CAPYTALE ({E['POP_CAPYTALE']})")
check(sum(v for k,v in fn['all']['xtab'].items() if k.endswith('|test'))==E['TESTEURS'], f"funnel tous : barreau testeur pur = TESTEURS ({E['TESTEURS']})")
check(all(k.split('|')[0] in ('via_site','capytale_direct') and k.split('|')[1] in ('forme','jamais') and k.split('|')[2] in ('test','ss','uniq','multi') for k in fn['all']['xtab']), "funnel : clés = canal|formation|profondeur (vocabulaire canonique)")

print("2c. Effet de la formation (facts_profiles — diag §6 : intensité, retour, médiation) :")
tf=fp['traj_formation_y1_devenir']; feff=fp['formation_effect']
check(sum(tf.values())==fp['reached_classe'], f"traj_formation Σ = atteint-classe ({fp['reached_classe']})")
check(all(k.split('|')[0] in ('forme','jamais') and k.split('|')[1] in ('multi','uniq') and k.split('|')[2] in ('rev','non','rec') for k in tf), "traj_formation : clés = formation|intensité|devenir")
check(feff['mult_y1']['forme']['n']+feff['mult_y1']['jamais']['n']==fp['reached_classe'], "mult_y1 formé+jamais = atteint-classe (176)")
check(feff['reach']['forme']['n']+feff['reach']['jamais']['n']==fp['n_touched_students'], "reach formé+jamais = touché-élèves (223)")
check(feff['retour']['forme']['n']+feff['retour']['jamais']['n']==fp['eligibles'], "retour formé+jamais = éligibles (77)")
check(sum(feff['med'][g][s]['n'] for g in ('reuse','unique') for s in ('forme','jamais'))==fp['eligibles'], "médiation (reuse+unique)×(formé+jamais) = éligibles (77)")

print("2b. Coupure année scolaire = 1ᵉʳ août (code ↔ GLOSSAIRE §1, anti-divergence) :")
import datetime as _dt
_aug = _dt.datetime(2024, 8, 19, tzinfo=_dt.timezone.utc)   # usage élève réel observé en août
_jul = _dt.datetime(2024, 7, 15, tzinfo=_dt.timezone.utc)
check(K.school_year(_aug) == '2024-2025', "août rattaché à l'année qui COMMENCE (mois≥8 → '2024-2025')")
check(K.school_year(_jul) == '2023-2024', "juillet rattaché à l'année qui s'achève ('2023-2024')")

print("3. Pseudonymat & canal (profiles_teacher.csv) :")
pt=pd.read_csv(f"{TR}/profiles_teacher.csv",dtype=str)
check(pt['teacher'].str.len().eq(8).all(), "teacher = md5[:8] (jamais le md5 complet)")
check(set(pt['canal'].unique())<={'via_site','capytale_direct'}, "canal ∈ {via_site, capytale_direct}")
check('cfcd2084' not in set(pt['teacher']), "hub fondateur exclu des profils")

print("4. Hub fondateur isolé partout (master + scénarios + typologie) :")
mt=pd.read_csv(f"{TR}/master_teachers.csv"); sc=pd.read_csv(f"{TR}/scenarios_teachers.csv")
ftj=loadstrict(f"{TR}/facts_typologie.json")
check(int(mt['n_eleves_uniq'].max())<404, "master_teachers : aucune ligne à 404 élèves")
check(int(sc['n_eleves_uniq'].max())<404 and sc['arch'].isna().sum()==0, "scenarios_teachers : pas de hub, pas de ligne sans archétype")
check(len(sc)==len(mt), f"scenarios ({len(sc)}) = master ({len(mt)}) — mêmes exclusions")
STALE={'downstream_archetypes','engaged_layers','site_segments','downstream_order','site_order'}
check(not (STALE & set(ftj)), "facts_typologie : aucune section périmée (downstream/engaged_layers/site_segments)")
check(ftj.get('n_pupils')!=5970 and ftj.get('n_taught')==len(mt), "facts_typologie : n_pupils distinct (≠5970) & n_taught = master")
check(ftj.get('retention_canonical',{}).get('eligibles')==fp['eligibles'], "facts_typologie : rétention canonique alignée sur facts_profiles")
# facts_investigation = snapshot ÉLARGI (n≈101) figé : doit porter un _meta documentant sa base & provenance,
# sinon il (re)devient une source stale silencieuse (la rétention CANONIQUE vit dans facts_typologie).
fiv=loadstrict(f"{TR}/facts_investigation.json")
_meta=fiv.get('_meta',{})
check(isinstance(_meta,dict) and 'base' in _meta and 'provenance' in _meta and 'retention_canonique_ailleurs' in _meta,
      "facts_investigation : _meta documente base élargie + provenance (non stale silencieux)")
check(fiv.get('eligible_n')==101, "facts_investigation : base élargie n=101 (≠ cohorte canonique 77 ; cf. facts_typologie)")

print("5. Pas d'e-mail dans les CSV versionnés (AUCUN, même @mathadata.fr) :")
EMAIL=re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
leak=[]
for f in glob.glob(f"{_ENQ}/**/data/*.csv", recursive=True):
    if EMAIL.search(open(f,encoding='utf-8',errors='ignore').read()): leak.append(_os.path.relpath(f,_ENQ))
check(not leak, f"aucun e-mail dans data/ ({'fuites: '+', '.join(leak) if leak else 'OK'})")

print("6. Cohérence dashboards ↔ facts (chiffres codés en dur ≠ source de vérité) :")
def rd(p): return open(f"{_ENQ}/{p}",encoding='utf-8').read()
fr=json.load(open(f"{TR}/facts_reconciliation.json")); ft=json.load(open(f"{TR}/facts_typologie.json"))
flux=rd("transverse/dashboard_flux_profs.html")
via=sum(v for k,v in fp['traj_canal_devenir'].items() if k.startswith('via_site'))
cap=sum(v for k,v in fp['traj_canal_devenir'].items() if k.startswith('capytale_direct'))
def span(html,key):
    m=re.search(r'<span data-f="'+re.escape(key)+r'">([^<]*)</span>',html); return m.group(1) if m else None
check(span(flux,'via.tot')==str(via), f"flux: span via.tot = {via} (généré depuis facts)")
check(span(flux,'cap.tot')==str(cap), f"flux: span cap.tot = {cap}")
check(span(flux,'elig')==str(fp['eligibles']), f"flux: span élig = {fp['eligibles']}")
# l'îlot F (qui alimente les Sankeys) doit refléter les trajectoires facts
mI=re.search(r'via:\{tot:(\d+),rev:(\d+),non:(\d+),rec:(\d+)\}',flux)
check(bool(mI) and [int(x) for x in mI.groups()]==[via,fp['traj_canal_devenir'].get('via_site|rev',0),fp['traj_canal_devenir'].get('via_site|non',0),fp['traj_canal_devenir'].get('via_site|rec',0)], "flux: îlot F via = trajectoires facts")
# îlot FN (entonnoir, Sankey C & D) + spans de taux du §1 = générés depuis facts['funnel'], jamais à la main
mFN=re.search(r'const FN=(\{.*\});',flux)
check(bool(mFN) and json.loads(mFN.group(1))==fn, "flux: îlot FN identique à facts_profiles.funnel (généré, pas dérivé)")
def _rc(o): return str(round(100*o['classe']/o['n']))
_rt=fn['touched']['rates']
check(span(flux,'rcViaClasse')==_rc(_rt['canal']['via_site']) and span(flux,'rcCapClasse')==_rc(_rt['canal']['capytale_direct']), "flux: spans taux-classe canal (§1) = facts funnel touché")
check(span(flux,'rcFormeClasse')==_rc(_rt['formation']['forme']) and span(flux,'rcJamaisClasse')==_rc(_rt['formation']['jamais']), "flux: spans taux-classe formation (§1) = facts funnel touché")
check(span(flux,'popAll')==str(fp['population']) and span(flux,'test')==str(fp['testeurs_purs']), f"flux: spans popAll={fp['population']} & test={fp['testeurs_purs']}")
# îlot FF (diag §6 formation→intensité→retour) + spans d'effet = générés depuis facts
mFF=re.search(r'const FF=(\{.*\});',flux)
check(bool(mFF) and json.loads(mFF.group(1))==tf, "flux: îlot FF = facts traj_formation_y1_devenir")
def _kb(o): return f"{o['k']}/{o['n']}"
check(span(flux,'feMultFbase')==_kb(feff['mult_y1']['forme']) and span(flux,'feMultJbase')==_kb(feff['mult_y1']['jamais']), "flux: spans usage-multiple §6 = facts formation_effect")
check(span(flux,'feRetFbase')==_kb(feff['retour']['forme']) and span(flux,'feMedRFbase')==_kb(feff['med']['reuse']['forme']) and span(flux,'feCensFbase')==_kb(feff['censored_formes']), "flux: spans retour/médiation/censure §6 = facts")
typo=rd("transverse/dashboard_typologie.html")
m=re.search(r'<div class="n red">(\d+) %</div><div class="l">des profs',typo)
check(bool(m) and int(m.group(1))==round(ft['retention_canonical']['taux']), f"typologie: strip rétention = {round(ft['retention_canonical']['taux'])} %")
v2=rd("site-vers-classe/dashboard_volet2.html")
check(f"{fr['population']['reached_classe_ge5']} ont atteint une classe" in v2, f"volet2: funnel classe ≥5 = {fr['population']['reached_classe_ge5']}")
check(f"{fr['population']['reached_seance_riche_ge10']} une séance riche" in v2, f"volet2: funnel séance riche ≥10 = {fr['population']['reached_seance_riche_ge10']}")

print(f"\n{'❌ '+str(len(fails))+' contrat(s) cassé(s)' if fails else '✅ tous les contrats sont respectés'}")
sys.exit(1 if fails else 0)
