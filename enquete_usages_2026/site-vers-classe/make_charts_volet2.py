#!/usr/bin/env python3
"""VOLET 2 — graphiques PNG depuis facts_cross.json (source de verite)."""
import json, os
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib import font_manager
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
OUT=f"{_ENQ}/site-vers-classe/charts"
DATA=f"{_ENQ}/site-vers-classe/data"
os.makedirs(OUT,exist_ok=True)
F=json.load(open(f"{DATA}/facts_cross.json"))
INK='#10243E'; BLUE='#2563EB'; TEAL='#0E9488'; AMBER='#D98324'; ROSE='#D6455A'; SLATE='#64748B'; PAPER='#FBFAF7'
plt.rcParams.update({'font.size':11,'axes.edgecolor':INK,'axes.linewidth':.8,'figure.facecolor':PAPER,'axes.facecolor':PAPER,
  'savefig.facecolor':PAPER,'axes.grid':True,'grid.color':'#E3DFD5','grid.linewidth':.7,'axes.titleweight':'bold'})
def save(fig,name):
    fig.tight_layout(); fig.savefig(f"{OUT}/{name}",dpi=150,bbox_inches='tight'); plt.close(fig); print("wrote",name)

# 1. PIPELINE FUNNEL (spine)
ov=F['overview']
v1=json.load(open(f"{_ENQ}/usage-capytale/data/facts_teachers.json"))
stages=[('Comptes crees',ov['accounts_total'],SLATE),
        ('Comptes complets',ov['full_accounts'],BLUE),
        ('Formes',ov['formed_total'],TEAL),
        ('Clic vers Capytale',ov['clicked_capytale'],AMBER),
        ('Ont enseigne (Capytale)',v1.get('taught',224),ROSE)]
fig,ax=plt.subplots(figsize=(9,4.4))
labels=[s[0] for s in stages]; vals=[s[1] for s in stages]; cols=[s[2] for s in stages]
y=range(len(stages))[::-1]
ax.barh(list(y),vals,color=cols,height=.62)
for yi,v,(_,_,c) in zip(y,vals,stages):
    ax.text(v+30,yi,f"{v:,}".replace(',',' '),va='center',fontweight='bold',color=INK)
ax.set_yticks(list(y)); ax.set_yticklabels(labels)
ax.set_title("Le pipeline, de la notoriete a la classe (grain compte/prof)")
ax.set_xlim(0,ov['accounts_total']*1.12); ax.grid(axis='y',visible=False)
ax.text(0.99,-0.16,"Cote site = intention (nominatif). 'Ont enseigne' = grain Capytale, volet 1.",
        transform=ax.transAxes,ha='right',fontsize=8,color=SLATE)
save(fig,"01_pipeline_funnel.png")

# 2. EFFET FORMATION grouped bars
fe=F['formation_effect']
groups=[('Non formes',fe['nouveau'],SLATE),('Presentiel',fe['forme_presentiel'],TEAL),('Webinaire',fe['forme_webinaire'],BLUE),('Anc. vague',fe['forme_ancienne_vague'],AMBER)]
metrics=[('% clic Capytale','pct_clicked_cap'),('% actif sur le site','pct_active'),
         ('% etab. avec usage classe','pct_uai_capytale_usage')]
import numpy as np
fig,ax=plt.subplots(figsize=(9,4.6))
x=np.arange(len(metrics)); w=.26
for i,(lab,g,c) in enumerate(groups):
    ax.bar(x+(i-1)*w,[g[m[1]] for m in metrics],w,label=lab,color=c)
    for xi,m in zip(x,metrics):
        ax.text(xi+(i-1)*w,g[m[1]]+.6,f"{g[m[1]]:.0f}",ha='center',fontsize=8,color=INK)
ax.set_xticks(x); ax.set_xticklabels([m[0] for m in metrics]); ax.set_ylabel('%')
ax.set_title("Effet de la formation sur l'usage (par type)"); ax.legend(frameon=False)
ax.grid(axis='x',visible=False)
save(fig,"02_effet_formation.png")

# 2b. ressources moyennes consultees
fig,ax=plt.subplots(figsize=(6.4,3.6))
labs=[g[0] for g in groups]; vals=[g[1]['mean_res_clicks'] for g in groups]
ax.bar(labs,vals,color=[g[2] for g in groups])
for i,v in enumerate(vals): ax.text(i,v+.1,f"{v}",ha='center',fontweight='bold')
ax.set_title("Ressources consultees / personne (moyenne)"); ax.grid(axis='x',visible=False)
save(fig,"02b_ressources_moy.png")

# 3. DEUX PORTES
td=F['two_doors']
fig,(a1,a2)=plt.subplots(1,2,figsize=(9.2,4))
a1.bar(['Site-first','Capytale-direct'],[td['capytale_uai_with_site_account'],td['capytale_uai_no_site_account']],
       color=[BLUE,AMBER])
a1.set_title(f"Etabs avec usage Capytale ({td['capytale_uai_teach']})")
for i,v in enumerate([td['capytale_uai_with_site_account'],td['capytale_uai_no_site_account']]):
    a1.text(i,v+1,str(v),ha='center',fontweight='bold')
a2.bar(['Avec trace','Sans trace classe'],[td['site_uai_with_capytale_footprint'],td['site_uai_no_capytale_footprint']],
       color=[TEAL,ROSE])
a2.set_title(f"Etabs declares cote site ({td['site_uai_total']})")
for i,v in enumerate([td['site_uai_with_capytale_footprint'],td['site_uai_no_capytale_footprint']]):
    a2.text(i,v+4,str(v),ha='center',fontweight='bold')
for a in (a1,a2): a.grid(axis='x',visible=False)
fig.suptitle("Les deux portes et les deux fuites",fontweight='bold')
save(fig,"03_deux_portes.png")

# 4. COHORTES timeline
coh=[c for c in F['formation_cohorts'] if c['month']]
months=sorted(set(c['month'] for c in coh))
pres={c['month']:c['n'] for c in coh if c['type']=='presentiel'}
web={c['month']:c['n'] for c in coh if c['type']=='webdecouv'}
fig,ax=plt.subplots(figsize=(10,4.2))
x=np.arange(len(months))
ax.bar(x,[pres.get(m,0) for m in months],color=TEAL,label='Presentiel')
ax.bar(x,[web.get(m,0) for m in months],bottom=[pres.get(m,0) for m in months],color=BLUE,label='Webinaire')
ax.set_xticks(x); ax.set_xticklabels(months,rotation=45,ha='right',fontsize=8)
ax.set_title("Cohortes de formation par mois et par type"); ax.set_ylabel('profs formes')
ax.legend(frameon=False); ax.grid(axis='x',visible=False)
save(fig,"04_cohortes.png")

# 5. GEOGRAPHIE top academies
geo=F['geography'][:12]
fig,ax=plt.subplots(figsize=(10,4.8))
x=np.arange(len(geo)); w=.4
ax.bar(x-w/2,[g['site_accounts'] for g in geo],w,label='Comptes site',color=BLUE)
ax.bar(x+w/2,[g['capytale_pupils'] for g in geo],w,label='Eleves Capytale',color=ROSE)
ax.set_xticks(x); ax.set_xticklabels([g['academie'] for g in geo],rotation=45,ha='right',fontsize=8)
ax.set_title("Presence site vs usage classe, par academie"); ax.legend(frameon=False); ax.grid(axis='x',visible=False)
save(fig,"05_geographie.png")

# 6. SEQUENCE compte/formation
sq=F['account_formation_sequence']
fig,ax=plt.subplots(figsize=(7,3.4))
order=[('Compte avant\nformation','account_before_formation',TEAL),
       ('Le jour meme','same_day',BLUE),
       ('Compte apres\nla formation','account_after_formation',AMBER),
       ('Date manquante','no_clean_date',SLATE)]
ax.bar([o[0] for o in order],[sq[o[1]] for o in order],color=[o[2] for o in order])
for i,o in enumerate(order): ax.text(i,sq[o[1]]+3,str(sq[o[1]]),ha='center',fontweight='bold')
ax.set_title("Compte cree avant / pendant / apres la formation (formes)"); ax.grid(axis='x',visible=False)
save(fig,"06_sequence.png")

# 7. CLICS CAPYTALE par activite (cote site)
ca=F['capytale_clicks_by_activity']
fig,ax=plt.subplots(figsize=(8.4,4))
ax.barh([c['label'] for c in ca][::-1],[c['distinct_users'] for c in ca][::-1],color=BLUE)
for i,c in enumerate(ca[::-1]): ax.text(c['distinct_users']+1,i,str(c['distinct_users']),va='center',fontsize=9)
ax.set_title("Clics vers Capytale depuis le site, par activite (users distincts)"); ax.grid(axis='y',visible=False)
save(fig,"07_clics_activite.png")

# 8. NEWSLETTER cascade
nc=F['newsletter_cascade']
st=[('Abonnes newsletter',nc['newsletter_subscribers'],SLATE),
    ('Convertis compte complet',nc['converted_full'],BLUE),
    ('Puis formes',nc['full_then_formed'],TEAL)]
fig,ax=plt.subplots(figsize=(8,3.4))
y=range(len(st))[::-1]
ax.barh(list(y),[s[1] for s in st],color=[s[2] for s in st],height=.6)
for yi,s in zip(y,st): ax.text(s[1]+15,yi,f"{s[1]:,}".replace(',',' '),va='center',fontweight='bold')
ax.set_yticks(list(y)); ax.set_yticklabels([s[0] for s in st])
ax.set_title("Cascade newsletter -> compte -> forme"); ax.set_xlim(0,nc['newsletter_subscribers']*1.15)
ax.grid(axis='y',visible=False)
save(fig,"08_newsletter.png")
print("charts done")
