#!/usr/bin/env python3
"""COMMONS — master per-teacher analytical table for the typology investigation.
Joins Capytale behaviour (volet1) + per-year trajectory (sessions) + establishment
context + upstream door/formation footprint (volet2). Teacher id is hashed (already
pseudonymous in source); output keeps establishment-grain context (uai/ips/acad) which
is non-PII. No name/email anywhere.
"""
import pandas as pd, numpy as np, json, os
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
BASE=_ENQ
SP=_os.environ.get("MATHADATA_LOCAL", f"{_ENQ}/_local")  # ex-scratch session -> dossier local stable (gitignore)
OUT=f"{BASE}/transverse/data"; os.makedirs(OUT,exist_ok=True)

T=pd.read_csv(f"{BASE}/usage-capytale/data/teachers.csv")
S=pd.read_csv(f"{BASE}/usage-capytale/data/sessions.csv")
U=pd.read_csv(f"{SP}/payload_users_work.csv")
PE=pd.read_csv(f"{BASE}/site-vers-classe/data/presentiel_etabs.csv")

DEMO='c81e728d9d4c2f636f067f89cc14862c'; PIO='cfcd208495d565ef66e7dff9f98764da'  # démo (exclu) + hub fondateur (isolé)
# ---- archétype (RÈGLES DÉTERMINISTES — PAS un k-means ; cf. fonction arch ci-dessous) ----
# Hub fondateur (404 él. sur 14 étab.) et compte démo EXCLUS de la population (règle d'isolement, glossaire §2).
TT=T[(T['taught']==True) & (~T['teacher'].isin([DEMO,PIO]))].copy()
for c in ['n_eleves_uniq','n_sessions','n_activities_taught','n_tests','n_sy_taught','ips']:
    TT[c]=pd.to_numeric(TT[c],errors='coerce')
def arch(r):
    intense=(r['n_sessions']>=6) or (r['n_activities_taught']>=3) or (r['n_tests']>=3 and r['n_sessions']>=4)
    if intense: return 'pionnier_intensif'
    if r['n_sy_taught']>=2: return 'fidele_pluriannuel'
    if r['n_eleves_uniq']<=8 and r['n_sessions']<=2: return 'petit_groupe'
    if r['n_activities_taught']>=2: return 'explorateur_multi'
    return 'deployeur_classe'
TT['arch']=TT.apply(arch,axis=1)

# ---- per-year teaching trajectory from sessions ----
S['date']=pd.to_datetime(S['date'],errors='coerce')
S['month']=S['date'].dt.month
gy=S.groupby(['teacher','sy']).agg(n_sess=('session_id','size'),n_el=('n_eleves','sum'),
    n_act=('mathadata_id','nunique'),max_sess=('n_eleves','max'),
    first_date=('date','min')).reset_index()
# entry year/activity/month + first-year metrics
ent=[]
for tid,g in gy.groupby('teacher'):
    g=g.sort_values('sy'); e=g.iloc[0]
    se=S[(S['teacher']==tid)&(S['sy']==e['sy'])].sort_values('date')
    first_act=se.iloc[0]['mathadata_id'] if len(se) else np.nan
    first_act_lab=se.iloc[0]['act_label'] if len(se) else None
    ent.append(dict(teacher=tid,entry_sy=e['sy'],entry_month=int(e['first_date'].month) if pd.notna(e['first_date']) else None,
        entry_activity=first_act,entry_act_label=first_act_lab,
        y1_sess=int(e['n_sess']),y1_el=int(e['n_el']),y1_act=int(e['n_act']),y1_max_sess=int(e['max_sess']),
        n_years_taught=g['sy'].nunique()))
ENT=pd.DataFrame(ent)

# ---- establishment context ----
nprof=T.groupby('uai')['teacher'].nunique().rename('n_prof_uai')
TT=TT.merge(nprof,on='uai',how='left')
site_uais=set(U['uai'].dropna().astype(str))
form_uais=set(PE['uai'].dropna().astype(str))
PE2=PE[['uai','formation_month','etab_type']].rename(columns={'formation_month':'form_month'})
TT['uai_s']=TT['uai'].astype(str)
TT['site_present']=TT['uai_s'].isin(site_uais)
TT['etab_formed']=TT['uai_s'].isin(form_uais)
TT=TT.merge(PE2,left_on='uai_s',right_on='uai',how='left',suffixes=('','_pe'))

# ---- merge trajectory ----
M=TT.merge(ENT,on='teacher',how='left')

# ---- retention eligibility (censoring) ----
# a teacher can "return" only if entered in 2023-24 or 2024-25
M['entry_cohort']=M['entry_sy']
M['eligible_return']=M['entry_sy'].isin(['2023-2024','2024-2025'])
M['returned']=(M['n_sy_taught']>=2)
# specifically taught the year AFTER entry
def ret_next(r):
    if r['entry_sy']=='2023-2024': return bool(r.get('active_2425',False) or r['taught_2425'])
    if r['entry_sy']=='2024-2025': return bool(r['taught_2526'])
    return None
M['returned_next_year']=M.apply(ret_next,axis=1)

# ---- IPS buckets ----
M['ips_bucket']=pd.cut(M['ips'],[0,95,110,200],labels=['faible(<95)','moyen(95-110)','favorise(>110)'])

# ---- pseudonymize teacher (canonical: arch, reach desc, hash tiebreaker -> stable) ----
M=M.sort_values(['arch','n_eleves_uniq','teacher'],ascending=[True,False,True]).reset_index(drop=True)
M['pseudo']=['T%03d'%i for i in range(len(M))]
cols=['pseudo','arch','behavior','n_eleves_uniq','n_sessions','n_activities_taught','n_tests',
 'n_sy_taught','returned','returned_next_year','eligible_return','entry_sy','entry_month',
 'entry_activity','entry_act_label','y1_sess','y1_el','y1_act','y1_max_sess',
 'uai','type_etab','secteur','academie','departement','commune','ips','ips_bucket',
 'n_prof_uai','site_present','etab_formed','form_month',
 'taught_2425','taught_2526','active_2324','active_2425','active_2526']
M[cols].to_csv(f"{OUT}/master_teachers.csv",index=False)
print("wrote master_teachers.csv:",M.shape)

# ---- RECONSTRUIT facts_typologie.json INTÉGRALEMENT (hub exclu, élèves distincts) ----
# (auparavant : patch partiel d'un ancien JSON → cohabitation de chiffres incompatibles. On réécrit tout.)
use=pd.read_csv(f"{BASE}/usage-capytale/data/usages_enriched.csv",dtype=str,keep_default_na=False)
stu=use[(use['role']=='student') & (~use['teacher'].isin([DEMO,PIO]))]
n_pupils_distinct=int(stu['student'].nunique())   # distinct global (l'ancien 5970 sommait des distincts/prof → double-comptait)
ft=dict(
    archetype_method="regles_deterministes (seuils explicites — PAS un k-means)",
    n_taught=int(len(M)),                                   # 223 (hub fondateur + démo exclus)
    n_pupils=n_pupils_distinct,                             # élèves DISTINCTS (≠ somme par prof)
    median_class_size=float(S['n_eleves'].median()),
    archetype_counts={k:int(v) for k,v in M['arch'].value_counts().items()},
)
try:
    pr=pd.read_csv(f"{OUT}/profiles_teacher.csv")
    elig=pr[(pr['n_years_classe']>=1)&(~pr['censored'])]
    ft['retention_canonical']=dict(base="usage-classe >=5 el., cohorte eligible, hub exclu (GLOSSAIRE §5)",
        eligibles=int(len(elig)),revenus=int(elig['revenu'].sum()),taux=round(100*elig['revenu'].mean(),1))
    ft['retention_broad_note']="base elargie 'tout contact eleve' (>=1 el.) : ~101 eligibles -> 31 % (~30,7) ; meme histoire, denominateur plus large"
except FileNotFoundError: pass
json.dump(ft,open(f"{OUT}/facts_typologie.json",'w'),ensure_ascii=False,indent=1)
print("reconstruit facts_typologie.json: n_taught",ft['n_taught'],"n_pupils",ft['n_pupils'])
print("\n== archetype counts =="); print(M['arch'].value_counts())
print("\n== entry cohort =="); print(M['entry_sy'].value_counts())
print("\n== eligible_return =="); print(M['eligible_return'].value_counts())
print("\n== returned_next_year (eligible only) ==")
print(M[M['eligible_return']]['returned_next_year'].value_counts(dropna=False))
print("\nsession-grain class size: median",S['n_eleves'].median(),"mean",round(S['n_eleves'].mean(),1))
print("teacher-grain unique pupils: median",M['n_eleves_uniq'].median())