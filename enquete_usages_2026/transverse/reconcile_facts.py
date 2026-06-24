#!/usr/bin/env python3
"""Fiche de réconciliation : recalcule, sur la base canonique (GLOSSAIRE, classe ≥5),
toutes les figures récurrentes des rapports narratifs, + les écarts ≥5 vs ≥10.
Sortie : transverse/data/facts_reconciliation.json (référence pour réconcilier les .md/.html)."""
import pandas as pd, numpy as np, json
from datetime import timedelta

import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
ROOT=_RT
V1=f"{ROOT}/enquete_usages_2026/usage-capytale/data"
T =f"{ROOT}/enquete_usages_2026/transverse/data"

PROF=pd.read_csv(f"{T}/profiles_teacher.csv")
PY  =pd.read_csv(f"{T}/profiles_teacher_year.csv")
sess=pd.read_csv(f"{V1}/sessions.csv")
sess['n_eleves']=pd.to_numeric(sess['n_eleves'],errors='coerce').fillna(0).astype(int)

def pct(a,b): return round(100*a/b,1) if b else None
F={}

# niveau de la 1ʳᵉ année classe (level≥4) — non persisté dans le CSV, on le recalcule
def y1lvl(h):
    g=PY[(PY['teacher']==h)&(PY['level']>=4)].sort_values('sy')
    return int(g.iloc[0]['level']) if len(g) else None
PROF['y1_level']=PROF['teacher'].map(y1lvl)

# ---- 1. reclassification classe ≥5 vs ≥10 (sessions élèves) ----
ge5=(sess['n_eleves']>=5).sum(); ge10=(sess['n_eleves']>=10).sum()
band59=((sess['n_eleves']>=5)&(sess['n_eleves']<10)).sum()
F['sessions']=dict(total=len(sess), classe_ge5=int(ge5), classe_ge10=int(ge10),
    bande_5_9=int(band59), sous_seuil_1_4=int(((sess['n_eleves']>=1)&(sess['n_eleves']<5)).sum()))

# ---- 2. population & profondeur ----
sess['h8']=sess['teacher'].str[:8]
sp=sess[sess['h8'].isin(set(PROF['teacher']))]
F['population']=dict(pop_capytale_2_5=len(PROF),                      # 260 (inclut 37 testeurs purs niveau 2)
    touche_eleves=int((PROF['max_level']>=3).sum()),                  # 223 (niveaux 3-5)
    reached_classe_ge5=int((PROF['n_years_classe']>=1).sum()),
    reached_seance_riche_ge10=int(sp[sp['n_eleves']>=10]['h8'].nunique()),   # 150 (mode-cible qualité)
    reached_grande_classe_ge20=int(sp[sp['n_eleves']>=20]['h8'].nunique()),  # 82 (paradoxe déployeur)
    sous_seuil_only=int((PROF['n_years_classe']==0).sum()),
    max_level=PROF['max_level'].value_counts().sort_index().to_dict())

# ---- 3. rétention (cohorte éligible = reached classe & non censurée) ----
reached=PROF[PROF['n_years_classe']>=1]; elig=reached[~reached['censored']]
F['retention']=dict(eligibles=len(elig), revenus=int(elig['revenu'].sum()),
    taux=pct(elig['revenu'].sum(),len(elig)),
    consecutif=int(PROF['retour_consecutif'].sum()), reactivation=int(PROF['reactivation'].sum()),
    censures=int(reached['censored'].sum()))

# ---- 4. effet réutilisation an-1, canal, formation (sur éligibles) ----
def split(mask_col,val):
    g=elig[elig[mask_col]==val]; return dict(n=len(g),rev=int(g['revenu'].sum()),taux=pct(g['revenu'].sum(),len(g)))
F['effet']=dict(
    reutilise_an1=split('y1_level',5), usage_unique_an1=split('y1_level',4),
    via_site=split('canal','via_site'), capytale_direct=split('canal','capytale_direct'),
    forme=split('formation_statut','forme'), jamais_forme=split('formation_statut','jamais'),
)

# ---- 5. effet ≥2 activités année 1 (classe) ----
# 1ʳᵉ année classe de chaque prof, nb d'activités cette année-là
acol='n_activites_classe' if 'n_activites_classe' in PY.columns else 'n_activites'
first=[]
for h,g in PY.groupby('teacher'):
    gc=g[g['level']>=4].sort_values('sy')
    if len(gc): first.append((h,int(gc.iloc[0][acol])))   # activités ATTEIGNANT une classe ≥5 (exclut le sous-seuil)
fa=pd.DataFrame(first,columns=['teacher','y1_acts']).merge(PROF[['teacher','revenu','censored','n_years_classe']],on='teacher')
fae=fa[(~fa['censored'])]
ge2=fae[fae['y1_acts']>=2]; eq1=fae[fae['y1_acts']<2]
F['activites_an1']=dict(ge2=dict(n=len(ge2),rev=int(ge2['revenu'].sum()),taux=pct(ge2['revenu'].sum(),len(ge2))),
                        eq1=dict(n=len(eq1),rev=int(eq1['revenu'].sum()),taux=pct(eq1['revenu'].sum(),len(eq1))))

# ---- 6. paradoxe du déployeur revisité : grande classe an1, 1 seule activité ----
# "déployeur" = a atteint une grande classe (≥20 él. une séance) ; combien sont revenus ?
big=sess[sess['n_eleves']>=20]['teacher'].unique()  # md5 complets? sessions.teacher = md5 complet
# map md5->h8 via PY? sessions.teacher is full md5; PROF.teacher is h8. Joindre par h8.
bigh=set(t[:8] for t in big)
dep=PROF[PROF['teacher'].isin(bigh) & (~PROF['censored'])]
F['deployeurs_grande_classe']=dict(n=len(dep),revenus=int(dep['revenu'].sum()),taux=pct(dep['revenu'].sum(),len(dep)))

# ---- 7. niveau ----
F['niveau']=PROF['niveau'].value_counts().to_dict()

# ---- 8. canal global (toute la pop, pas seulement éligibles) ----
F['canal_global']=PROF['canal'].value_counts().to_dict()
F['formation_global']=PROF['formation_statut'].value_counts().to_dict()
F['formation_timing']=PROF['formation_timing'].fillna('na').value_counts().to_dict()

json.dump(F,open(f"{T}/facts_reconciliation.json","w"),ensure_ascii=False,indent=2,default=int)
print(json.dumps(F,ensure_ascii=False,indent=2,default=int))
