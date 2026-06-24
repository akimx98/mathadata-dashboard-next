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
TR=f"{_ENQ}/transverse/data"; V1=f"{_ENQ}/usage-capytale/data"; V2=f"{_ENQ}/site-vers-classe/data"
fails=[]
def check(cond,msg):
    print(("  ✓ " if cond else "  ✗ ")+msg); (fails.append(msg) if not cond else None)

print("1. JSON strict (aucun NaN/Inf) :")
for f in glob.glob(f"{_ENQ}/**/data/*.json", recursive=True):
    try:
        json.load(open(f)); check(True, _os.path.relpath(f,_ENQ))
    except Exception as e:
        check(False, f"{_os.path.relpath(f,_ENQ)} — {e}")

print("2. Invariants profils (facts_profiles.json) :")
fp=json.load(open(f"{TR}/facts_profiles.json"))
check(fp['population']==fp['n_reached_classe']+fp['max_level'].get('3',0), "population = atteint-classe + sous-seuil")
check(sum(fp['canal'].values())==fp['population'], "somme canal = population")
check(sum(fp['traj_canal_devenir'].values())==fp['n_reached_classe'], "trajectoires1 = profs atteint-classe")
check(fp['eligibles']<=fp['reached_classe'], "éligibles ⊆ atteint-classe")
check(fp['revenus_total']==fp['retour_consecutif']+fp['reactivation'], "revenus = consécutif + réactivation")

print("3. Pseudonymat & canal (profiles_teacher.csv) :")
pt=pd.read_csv(f"{TR}/profiles_teacher.csv",dtype=str)
check(pt['teacher'].str.len().eq(8).all(), "teacher = md5[:8] (jamais le md5 complet)")
check(set(pt['canal'].unique())<={'via_site','capytale_direct'}, "canal ∈ {via_site, capytale_direct}")
check('cfcd2084' not in set(pt['teacher']), "hub fondateur exclu des profils")

print("4. Hub exclu de la typologie (master_teachers.csv) :")
mt=pd.read_csv(f"{TR}/master_teachers.csv")
check(int(mt['n_eleves_uniq'].max())<404, "aucune ligne à 404 élèves (hub isolé)")

print("5. Pas d'e-mail (PII) dans les CSV versionnés :")
EMAIL=re.compile(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}')
leak=[]
for f in glob.glob(f"{_ENQ}/**/data/*.csv", recursive=True):
    txt=open(f,encoding='utf-8',errors='ignore').read()
    if [m for m in EMAIL.findall(txt) if not m.endswith('mathadata.fr')]: leak.append(_os.path.relpath(f,_ENQ))
check(not leak, f"aucun e-mail non-mathadata.fr dans data/ ({'fuites: '+', '.join(leak) if leak else 'OK'})")

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
typo=rd("transverse/dashboard_typologie.html")
m=re.search(r'<div class="n red">(\d+) %</div><div class="l">des profs',typo)
check(bool(m) and int(m.group(1))==round(ft['retention_canonical']['taux']), f"typologie: strip rétention = {round(ft['retention_canonical']['taux'])} %")
v2=rd("site-vers-classe/dashboard_volet2.html")
check(f"{fr['population']['reached_classe_ge5']} ont atteint une classe" in v2, f"volet2: funnel classe ≥5 = {fr['population']['reached_classe_ge5']}")
check(f"{fr['population']['reached_seance_riche_ge10']} une séance riche" in v2, f"volet2: funnel séance riche ≥10 = {fr['population']['reached_seance_riche_ge10']}")

print(f"\n{'❌ '+str(len(fails))+' contrat(s) cassé(s)' if fails else '✅ tous les contrats sont respectés'}")
sys.exit(1 if fails else 0)
