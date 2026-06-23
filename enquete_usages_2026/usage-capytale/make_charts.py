#!/usr/bin/env python3
"""Génère les graphiques PNG de l'enquête à partir de facts.json + tables canoniques."""
import json, numpy as np, pandas as pd
import matplotlib; matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator

import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
D=f"{_ENQ}/usage-capytale"
F=json.load(open(f"{D}/data/facts.json"))
sess=pd.read_csv(f"{D}/data/sessions.csv")
te=pd.read_csv(f"{D}/data/teachers.csv")
DEMO='c81e728d9d4c2f636f067f89cc14862c'
sess=sess[sess['teacher']!=DEMO]; te=te[te['teacher']!=DEMO]

# palette
BLUE='#1d4ed8'; TEAL='#0d9488'; GREEN='#16a34a'; ORANGE='#ea580c'; RED='#dc2626'; GREY='#94a3b8'; DARK='#0f172a'
SY_COL={'2023-2024':GREY,'2024-2025':TEAL,'2025-2026':BLUE}
plt.rcParams.update({'font.size':11,'axes.titlesize':13,'axes.titleweight':'bold',
    'axes.spines.top':False,'axes.spines.right':False,'figure.dpi':130,'axes.grid':True,
    'grid.alpha':0.25,'grid.linewidth':0.6,'font.family':'DejaVu Sans'})

def save(fig,name):
    fig.tight_layout(); fig.savefig(f"{D}/charts/{name}",bbox_inches='tight'); plt.close(fig); print("saved",name)

# 1. Usages élèves par mois, coloré par année scolaire
ms=F['growth']['monthly_student']
months=sorted(ms.keys())
def sy_of(ym):
    y,m=map(int,ym.split('-')); sy=y if m>=8 else y-1; return f"{sy}-{sy+1}"
cols=[SY_COL.get(sy_of(m),GREY) for m in months]
fig,ax=plt.subplots(figsize=(11,4.2))
ax.bar(range(len(months)),[ms[m] for m in months],color=cols,width=0.85)
ax.set_xticks(range(len(months))); ax.set_xticklabels(months,rotation=90,fontsize=8)
ax.set_ylabel("Usages élèves (clones)")
ax.set_title("Usages élèves par mois — accélération 2025-2026")
from matplotlib.patches import Patch
ax.legend(handles=[Patch(color=SY_COL[k],label=k) for k in SY_COL],frameon=False,loc='upper left')
save(fig,"01_usages_mensuels.png")

# 2. Par année scolaire : élèves + tests
g=F['growth']['usages_by_sy']; sys=list(g.keys())
fig,ax=plt.subplots(figsize=(6.5,4.2))
x=np.arange(len(sys)); w=0.38
ax.bar(x-w/2,[g[s]['student'] for s in sys],w,label='Usages élèves',color=BLUE)
ax.bar(x+w/2,[g[s]['teacher'] for s in sys],w,label='Tests profs',color=ORANGE)
for i,s in enumerate(sys):
    ax.text(i-w/2,g[s]['student']+40,str(g[s]['student']),ha='center',fontsize=9,fontweight='bold')
    ax.text(i+w/2,g[s]['teacher']+40,str(g[s]['teacher']),ha='center',fontsize=8)
ax.set_xticks(x); ax.set_xticklabels(sys)
ax.set_title("Usages par année scolaire\n(extraction 19 juin — année scolaire quasi close à la mi-juin)")
ax.legend(frameon=False); ax.set_ylabel("Nombre d'usages")
save(fig,"02_usages_par_annee.png")

# 3. Élèves par activité x année scolaire (top activités)
asy=F['growth']['student_by_activity_sy']
acts=sorted(asy.keys(),key=lambda a:-sum(asy[a].values()))[:8]
fig,ax=plt.subplots(figsize=(10,5))
y=np.arange(len(acts));
v24=[asy[a].get('2024-2025',0) for a in acts]; v25=[asy[a].get('2025-2026',0) for a in acts]; v23=[asy[a].get('2023-2024',0) for a in acts]
ax.barh(y,v23,color=GREY,label='2023-2024')
ax.barh(y,v24,left=v23,color=TEAL,label='2024-2025')
ax.barh(y,v25,left=np.array(v23)+np.array(v24),color=BLUE,label='2025-2026')
ax.set_yticks(y); ax.set_yticklabels(acts,fontsize=9); ax.invert_yaxis()
ax.set_xlabel("Usages élèves (cumul)"); ax.set_title("Usages élèves par activité et année scolaire")
ax.legend(frameon=False,loc='lower right')
save(fig,"03_activites_par_annee.png")

# 4. Comportement enseignant (entonnoir)
up=F['usage_patterns']
fig,ax=plt.subplots(figsize=(8,4))
cats=['Testé,\njamais enseigné\n(non converti)','Testé PUIS\nenseigné','Enseigné SANS\ntest préalable']
vals=[up['tested_never_taught'],up['tested_before_teaching'],up['taught_without_prior_test']]
colz=[RED,GREEN,BLUE]
b=ax.bar(cats,vals,color=colz,width=0.6)
for r,v in zip(b,vals): ax.text(r.get_x()+r.get_width()/2,v+2,str(v),ha='center',fontweight='bold')
ax.set_title("Comment les 261 profs abordent MathAData")
ax.set_ylabel("Nombre de profs")
save(fig,"04_comportement_profs.png")

# 5. Conversion test->enseignement par activité
af=pd.DataFrame(F['usage_patterns']['activity_funnel'])
af=af[af['n_profs_tested']>=5].sort_values('conv_rate')
fig,ax=plt.subplots(figsize=(9,4.5))
cc=[GREEN if v>=70 else (ORANGE if v>=55 else RED) for v in af['conv_rate']]
b=ax.barh(af['activity'],af['conv_rate'],color=cc)
for r,v in zip(b,af['conv_rate']): ax.text(v+1,r.get_y()+r.get_height()/2,f"{v:.0f}%",va='center',fontsize=9)
ax.set_xlabel("Taux de conversion test → enseignement (%)")
ax.set_title("Conversion test→classe par activité (profs ayant testé)")
ax.axvline(70,color=GREY,ls='--',lw=0.8)
save(fig,"05_conversion_activite.png")

# 6. Saisonnalité (classes >=10 par mois calendaire)
cm=F['temporal']['classes_by_month']
order=[9,10,11,12,1,2,3,4,5,6,7,8]
labels=['Sep','Oct','Nov','Déc','Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû']
vals=[cm.get(str(m),cm.get(m,0)) for m in order]
fig,ax=plt.subplots(figsize=(9,4))
ax.bar(range(12),vals,color=[BLUE if m in(3,4,5,6) else TEAL for m in order])
ax.set_xticks(range(12)); ax.set_xticklabels(labels)
ax.set_title("Saisonnalité des classes (séances ≥10 élèves) — pic de printemps")
ax.set_ylabel("Nb de classes")
save(fig,"06_saisonnalite.png")

# 7. Distribution taille de classe
sizes=sess['n_eleves']
bins=[0,1,2,5,11,18,30,200]; labels=['1','2','3-5','6-11','12-18','19-30','30+']
cut=pd.cut(sizes,bins,labels=labels)
vc=cut.value_counts().reindex(labels)
fig,ax=plt.subplots(figsize=(8.5,4))
cols=[GREY,GREY,GREY,TEAL,GREEN,GREEN,BLUE]
b=ax.bar(labels,vc.values,color=cols)
for r,v in zip(b,vc.values): ax.text(r.get_x()+r.get_width()/2,v+2,str(int(v)),ha='center',fontsize=9)
ax.set_title("Distribution de la taille des séances\n(12-18 = demi-groupe en salle info)")
ax.set_xlabel("Nb d'élèves dans la séance"); ax.set_ylabel("Nb de séances")
save(fig,"07_taille_classe.png")

# 8. Top académies par élèves (total)
ac=F['establishment_profiles']['by_academie']
acd=pd.DataFrame(ac).T.sort_values('n_eleves',ascending=True).tail(12)
fig,ax=plt.subplots(figsize=(8.5,5))
ax.barh(acd.index,acd['n_eleves'],color=BLUE)
for i,(idx,r) in enumerate(acd.iterrows()): ax.text(r['n_eleves']+8,i,f"{int(r['n_eleves'])} ({int(r['n_profs'])}p)",va='center',fontsize=8)
ax.set_title("Élèves uniques par académie (cumul, top 12)")
ax.set_xlabel("Élèves uniques")
save(fig,"08_academies.png")

# 9. Rétention & nouveaux profs 2025-26
r=F['growth']['retention']
fig,ax=plt.subplots(figsize=(7,4))
ax.bar(['Profs enseignant\n2024-2025','...ré-enseignant\n2025-2026'],[r['taught_2425'],r['retained_2425_to_2526']],color=[TEAL,GREEN],width=0.5)
ax.text(0,r['taught_2425']+1,str(r['taught_2425']),ha='center',fontweight='bold')
ax.text(1,r['retained_2425_to_2526']+1,f"{r['retained_2425_to_2526']} ({r['retention_rate']:.0f}%)",ha='center',fontweight='bold')
ax2=ax.twinx(); ax2.axis('off')
ax.set_title(f"Rétention faible : {r['retention_rate']:.0f}% — et {r['new_in_2526_share']:.0f}% des profs 2025-26 sont nouveaux")
save(fig,"09_retention.png")

# 10. IPS user vs national (densités approx via tables)
ep=F['establishment_profiles']
fig,ax=plt.subplots(figsize=(7.5,4))
# reconstruire distributions
ann=pd.read_csv(f"{_RT}/public/data/annuaire_etablissements.csv",dtype=str,keep_default_na=False)
nat=pd.to_numeric(ann[ann['type_etablissement']=='lycee']['ips'],errors='coerce').dropna()
usr=pd.to_numeric(te[te['type_etab']=='lycee']['ips'],errors='coerce').dropna()
ax.hist(nat,bins=30,density=True,alpha=0.45,color=GREY,label=f"Lycées France (n={len(nat)}, moy {nat.mean():.0f})")
ax.hist(usr,bins=20,density=True,alpha=0.6,color=BLUE,label=f"Lycées MathAData (n={len(usr)}, moy {usr.mean():.0f})")
ax.axvline(nat.mean(),color=GREY,ls='--'); ax.axvline(usr.mean(),color=BLUE,ls='--')
ax.set_title("IPS : les lycées MathAData légèrement au-dessus de la moyenne"); ax.set_xlabel("IPS"); ax.legend(frameon=False,fontsize=8)
save(fig,"10_ips.png")

print("Charts terminés.")
