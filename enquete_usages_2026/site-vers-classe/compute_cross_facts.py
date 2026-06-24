#!/usr/bin/env python3
"""
VOLET 2 — facts_cross.json : tous les chiffres du croisement site x Capytale.
Source de verite unique. Lit la table de travail (SCRATCH) + Capytale + by_uai.
Aucune PII en sortie (id payload entier opaque + grains etablissement/academie).

Garde-fou tracking : clics/sessions/events traces depuis ~27 nov 2025 seulement.
 -> conversion etablissement (at_uai_with_capytale) = historique COMPLET Capytale (2023->2026), non biaise.
 -> metriques de clic (clicked_cap, active) = fenetre recente, signalees comme telles.
"""
import json, csv, os, unicodedata
import pandas as pd, numpy as np
def norm_acad(a):
    if not isinstance(a,str) or not a.strip(): return ''
    s=''.join(c for c in unicodedata.normalize('NFD',a) if unicodedata.category(c)!='Mn')
    return ''.join(ch for ch in s.lower() if ch.isalnum())   # strip espaces/traits d'union -> fusionne les variantes
ACAD_DISPLAY={'creteil':'Créteil','versailles':'Versailles','lille':'Lille','paris':'Paris',
 'bordeaux':'Bordeaux','montpellier':'Montpellier','toulouse':'Toulouse','nantes':'Nantes',
 'amiens':'Amiens','lyon':'Lyon','normandie':'Normandie','rennes':'Rennes','strasbourg':'Strasbourg',
 'dijon':'Dijon','nice':'Nice','limoges':'Limoges','reims':'Reims','aixmarseille':'Aix-Marseille',
 'etranger':'Étranger','grenoble':'Grenoble','besancon':'Besançon','orleanstours':'Orléans-Tours',
 'poitiers':'Poitiers','clermontferrand':'Clermont-Ferrand','nancymetz':'Nancy-Metz',
 'polynesiefrancaise':'Polynésie française','guadeloupe':'Guadeloupe','lareunion':'La Réunion',
 'martinique':'Martinique','guyane':'Guyane','mayotte':'Mayotte','corse':'Corse','wallisetfutuna':'Wallis-et-Futuna'}
def acad_disp(a): k=norm_acad(a); return ACAD_DISPLAY.get(k,a.strip() if isinstance(a,str) else '')
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
BASE=f"{_RT}/public/data"
OUT =f"{_ENQ}/site-vers-classe/data"
SCRATCH=_os.environ.get("MATHADATA_LOCAL", f"{_ENQ}/_local")  # ex-scratch session -> dossier local stable (gitignore)
DEMO, PIO = K.DEMO, K.PIO
TRACK_START='2025-11-27'

W=pd.read_csv(f"{SCRATCH}/payload_users_work.csv")
for c in ['fdate','createdAt','first_mv','first_rc','first_cap','last_login']:
    W[c]=pd.to_datetime(W[c],utc=True,errors='coerce')
W['uai']=W['uai'].fillna('').astype(str)
W['acad']=W['acad'].fillna('').astype(str)

cap=pd.read_csv(K.capytale_csv(),dtype=str,keep_default_na=False)
cap=cap[cap['teacher']!=DEMO].copy(); cap['role']=cap['role'].str.strip().str.lower()
cap['dt']=pd.to_datetime(pd.to_numeric(cap['created'],errors='coerce'),unit='s',utc=True)
stud=cap[cap['role']=='student']; teach=cap[cap['role']=='teacher']

# UAI sets cote Capytale
cap_uai_teach=set(x for x in cap['uai_teach'] if x.strip())
cap_uai_el=set(x for x in cap['uai_el'] if x.strip())
cap_uai_used=set(x for x in stud['uai_el'] if x.strip())   # etabs avec usage ELEVE reel
cap_uai_any=cap_uai_teach|cap_uai_el

# first capytale student usage date per uai (pour cohortes)
uai_first_use=stud[stud['uai_el'].str.strip()!=''].groupby('uai_el')['dt'].min().to_dict()
uai_pupils=stud.groupby('uai_el')['student'].nunique().to_dict()

site_uai=set(x for x in W['uai'] if x)
F=W[W['is_formed']]; N=W[~W['is_formed']]

def rate(num,den): return round(100*num/den,1) if den else None
facts={}

# ---------- 1. overview ----------
facts['overview']=dict(
  accounts_total=int(len(W)),
  newsletter_only=int((W['newsletter_only']==True).sum()),
  full_accounts=int((W['newsletter_only']!=True).sum()),
  formed_total=int(W['is_formed'].sum()),
  formed_presentiel=int((W['ftype']=='presentiel').sum()),
  formed_webinaire=int((W['ftype']=='webinaire').sum()),   # FIX (24/06) : la couche amont produit 'webinaire' (webdecouv+webinaire), pas 'webdecouv' → valait 0 à tort
  formed_type_unknown=int(W['is_formed'].sum()-((W['ftype']=='presentiel').sum()+(W['ftype']=='webinaire').sum())),
  with_uai=int((W['uai']!='').sum()),
  clicked_capytale=int(W['clicked_cap'].sum()),
  tracking_start=TRACK_START,
)

# ---------- 2. site funnel (identified) ----------
# global (toutes cohortes ; biais fenetre tracking pour les vieux comptes)
def funnel(df,label):
    n=len(df)
    return dict(label=label, accounts=n,
        active=int(df['active'].sum()), active_rate=rate(df['active'].sum(),n),
        module=int(df['viewed_module'].sum()), module_rate=rate(df['viewed_module'].sum(),n),
        resource=int(df['clicked_res'].sum()), resource_rate=rate(df['clicked_res'].sum(),n),
        capytale=int(df['clicked_cap'].sum()), capytale_rate=rate(df['clicked_cap'].sum(),n))
full=W[W['newsletter_only']!=True]
trackable=full[full['createdAt']>=pd.Timestamp(TRACK_START,tz='UTC')]
facts['site_funnel']=dict(
  all_full_accounts=funnel(full,'comptes complets (toutes dates)'),
  trackable_cohort=funnel(trackable,f'comptes crees apres {TRACK_START}'),
  note="Le tracking clics/modules ne commence que le 27 nov 2025 : les taux 'toutes dates' sous-estiment l'usage des comptes anterieurs. La cohorte trackable est la mesure propre du funnel site."
)
# delais account -> first action (jours), parmi ceux qui ont agi
def delays(df, col):
    d=(df[col]-df['createdAt']).dt.total_seconds()/86400
    d=d[d.notna() & (d>=-1)]
    return dict(n=int(len(d)), p50=round(float(d.median()),1) if len(d) else None,
                p90=round(float(d.quantile(.9)),1) if len(d) else None)
facts['delays_days']=dict(
  to_module=delays(full,'first_mv'), to_resource=delays(full,'first_rc'), to_capytale=delays(full,'first_cap'))

# ---------- 3. EFFET FORMATION ----------
def grp_stats(df,label):
    n=len(df); nu=df[df['uai']!='']
    at_used=nu['uai'].isin(cap_uai_used).sum()
    at_any =nu['uai'].isin(cap_uai_any).sum()
    return dict(label=label, n=n, with_uai=int(len(nu)),
        pct_clicked_cap=rate(df['clicked_cap'].sum(),n),
        pct_active=rate(df['active'].sum(),n),
        pct_uai_capytale_usage=rate(at_used,len(nu)),     # etab du prof a un usage ELEVE Capytale (hist complet)
        pct_uai_capytale_any=rate(at_any,len(nu)),
        mean_cap_clicks=round(float(df['n_cap_clicks'].mean()),2),
        mean_res_clicks=round(float(df['n_res_clicks'].mean()),2))
facts['formation_effect']=dict(
  nouveau=grp_stats(N,'non formes'),
  forme_all=grp_stats(F,'formes (tous)'),
  forme_presentiel=grp_stats(W[W['fcat']=='presentiel'],'formes presentiel'),
  forme_webinaire=grp_stats(W[W['fcat']=='webinaire'],'formes webinaire (distanciel, vrai)'),
  forme_ancienne_vague=grp_stats(W[W['fcat']=='ancienne_vague'],'anciens formes (avant 15/01/26, type inconnu)'),
  note="Typage REEL via formation-codes (trainedFormation). 'webinaire' = webdecouv+webinaire genuine ; 'ancienne_vague' = 147 formes avant le systeme de codes (15/01/26), type/date inconnus, separes du webinaire (ils contaminaient l'ancien webdecouv). pct_uai_capytale_usage = part des comptes (a UAI connu) dont l'etablissement a un usage ELEVE effectif Capytale sur tout l'historique 2023-2026 (non biaise par la fenetre de tracking)."
)

# ---------- 4. DEUX PORTES ----------
cap_teach_with_site = cap_uai_teach & site_uai
cap_teach_no_site   = cap_uai_teach - site_uai
site_with_footprint = site_uai & cap_uai_any     # trace Capytale quelconque (teach OU el)
site_with_student   = site_uai & cap_uai_used    # trace ELEVE (plus stricte)
site_no_cap         = site_uai - cap_uai_any
cap_direct_high     = cap_uai_el - site_uai      # borne haute (grain uai_el)
facts['two_doors']=dict(
  capytale_uai_teach=len(cap_uai_teach),
  capytale_uai_with_site_account=len(cap_teach_with_site),
  capytale_uai_no_site_account=len(cap_teach_no_site),   # porte Capytale-direct (borne basse, grain uai_teach)
  capytale_direct_high_bound=len(cap_direct_high),       # borne haute (grain uai_el)
  pct_capytale_direct=rate(len(cap_teach_no_site),len(cap_uai_teach)),
  site_uai_total=len(site_uai),
  site_uai_with_capytale_footprint=len(site_with_footprint),  # avec trace Capytale (teach OU el)
  site_uai_with_student_usage=len(site_with_student),         # trace eleve stricte
  site_uai_no_capytale_footprint=len(site_no_cap),            # declares mais aucune trace Capytale
  pct_site_uai_no_footprint=rate(len(site_no_cap),len(site_uai)),
  note=(f"Grain etablissement (UAI). Capytale-direct = etab a usage Capytale sans compte site declarant cet UAI : "
        f"borne basse {len(cap_teach_no_site)} (uai_teach), borne haute {len(cap_direct_high)} (uai_el). "
        f"site_uai_with_capytale_footprint ({len(site_with_footprint)}) + site_uai_no_capytale_footprint "
        f"({len(site_no_cap)}) = site_uai_total ({len(site_uai)}).")
)

# ---------- 5. COHORTES DE FORMATION ----------
# presentiel = ancre etablissement (un lycee, une date). webdecouv = ancre temporelle.
coh=[]
for (m,t),g in F.groupby(['fmonth','ftype']):
    if pd.isna(m): continue
    nu=g[g['uai']!='']
    at_used=int(nu['uai'].isin(cap_uai_used).sum())
    coh.append(dict(month=m,type=t,n=int(len(g)),with_uai=int(len(nu)),
        at_uai_used=at_used, pct=rate(at_used,len(nu)),
        clicked_cap=int(g['clicked_cap'].sum())))
facts['formation_cohorts']=sorted(coh,key=lambda r:(r['month'] or '',r['type']))

# presentiel par etablissement (vrai quasi-experiment) : usage Capytale apres la date de formation ?
pres=F[F['ftype']=='presentiel']
etab_rows=[]
for u,g in pres[pres['uai']!=''].groupby('uai'):
    fd=g['fdate'].min()
    fu=uai_first_use.get(u)
    after = bool(fu is not None and fd is not None and fu>=fd-pd.Timedelta(days=7))
    any_use = u in cap_uai_used
    etab_rows.append(dict(uai=u, n_formes=int(len(g)), commune=g['etab_commune'].iloc[0],
        acad=g['acad'].iloc[0], etab_type=g['etab_type'].iloc[0],
        formation_month=g['fmonth'].min(), any_capytale_usage=any_use,
        usage_after_formation=after, pupils=int(uai_pupils.get(u,0))))
ER=pd.DataFrame(etab_rows)
if len(ER):
    facts['presentiel_etabs']=dict(
      n_etabs=int(len(ER)),
      with_any_usage=int(ER['any_capytale_usage'].sum()),
      pct_with_usage=rate(ER['any_capytale_usage'].sum(),len(ER)),
      with_usage_after=int(ER['usage_after_formation'].sum()),
      pct_usage_after=rate(ER['usage_after_formation'].sum(),len(ER)),
      total_pupils_in_these_etabs=int(ER['pupils'].sum()))
    ER.sort_values('pupils',ascending=False).to_csv(f"{OUT}/presentiel_etabs.csv",index=False)

# ---------- 6. ESTABLISHMENT MATRIX ----------
both=site_uai & cap_uai_used
facts['establishment_matrix']=dict(
  both_site_and_classroom=len(both),
  site_only=len(site_uai - cap_uai_any),
  classroom_only=len(cap_uai_used - site_uai),
  pupils_in_classroom_only=int(sum(uai_pupils.get(u,0) for u in (cap_uai_used - site_uai))),
  pupils_in_both=int(sum(uai_pupils.get(u,0) for u in both)),
)

# ---------- 7. RESOURCES ----------
# clics capytale par activite (cote site) -- depuis cap_acts
from collections import Counter
act_clicks=Counter()
for s in W['cap_acts'].dropna():
    for a in str(s).split(','):
        if a.strip(): act_clicks[a.strip()]+=1   # nb d'utilisateurs distincts ayant clique l'activite
ACTLAB={'3518185':'Stat classification','2548348':"Intro a l'IA",'3515488':'Equation reduite',
 '6944347':'Stat sante foetus','6659633':'Geometrie reperee','5862412':'Droite produit scalaire',
 '8790616':'Eq. cartesienne/vecteur','5909323':'Challenge IA','3534169':'Challenge BTS/NSI'}
facts['capytale_clicks_by_activity']=[dict(act=a,label=ACTLAB.get(a,a),distinct_users=c)
    for a,c in act_clicks.most_common()]

# ---------- 8. GEOGRAPHY ----------
geo={}
ann=pd.read_csv(f"{BASE}/annuaire_etablissements.csv",dtype=str,keep_default_na=False)
uai_acad=ann.set_index('uai')['academie'].to_dict()
def gadd(a,key,n):
    k=norm_acad(a)
    if not k: return
    geo.setdefault(k,dict(academie=acad_disp(a),site_accounts=0,formed=0,capytale_pupils=0))[key]+=n
for a in W['acad']: gadd(a,'site_accounts',1)
for a in F['acad']: gadd(a,'formed',1)
for u,n in uai_pupils.items(): gadd(uai_acad.get(u,''),'capytale_pupils',n)
facts['geography']=sorted(geo.values(),key=lambda r:-(r['capytale_pupils']+r['site_accounts']))[:25]

# ---------- 9. NEWSLETTER CASCADE ----------
facts['newsletter_cascade']=dict(
  newsletter_subscribers=int((W['newsletter']==True).sum()),
  newsletter_only_still=int((W['newsletter_only']==True).sum()),
  converted_full=int(((W['newsletter']==True)&(W['newsletter_only']!=True)).sum()),
  full_then_formed=int(((W['newsletter_only']!=True)&(W['is_formed'])).sum()),
)

# ---------- 10. account-vs-formation sequence ----------
seq={'same_day':0,'account_before_formation':0,'account_after_formation':0,'no_clean_date':0}
for _,u in F.iterrows():
    if pd.isna(u['fdate']): seq['no_clean_date']+=1; continue
    d=(u['createdAt']-u['fdate']).total_seconds()/86400
    if d>1: seq['account_after_formation']+=1
    elif d<-1: seq['account_before_formation']+=1
    else: seq['same_day']+=1
facts['account_formation_sequence']=seq

json.dump(facts,open(f"{OUT}/facts_cross.json","w"),ensure_ascii=False,indent=1,default=str)
print(json.dumps(facts,ensure_ascii=False,indent=1,default=str))
