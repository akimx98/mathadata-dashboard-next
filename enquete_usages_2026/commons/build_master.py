#!/usr/bin/env python3
"""COMMONS — master per-teacher analytical table for the typology investigation.
Joins Capytale behaviour (volet1) + per-year trajectory (sessions) + establishment
context + upstream door/formation footprint (volet2). Teacher id is hashed (already
pseudonymous in source); output keeps establishment-grain context (uai/ips/acad) which
is non-PII. No name/email anywhere.
"""
import pandas as pd, numpy as np, json, os
BASE="/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026"
SP="/private/tmp/claude-502/-Users-akim-Documents-MathAData-Git-mathadata-dashboard-next/49f4f306-c2bb-43a0-af8f-f1b5ce99e908/scratchpad"
OUT=f"{BASE}/commons/data"; os.makedirs(OUT,exist_ok=True)

T=pd.read_csv(f"{BASE}/volet1/data/teachers.csv")
S=pd.read_csv(f"{BASE}/volet1/data/sessions.csv")
U=pd.read_csv(f"{SP}/payload_users_work.csv")
PE=pd.read_csv(f"{BASE}/volet2/data/presentiel_etabs.csv")

# ---- archetype (rule-based, same as facts_typologie) ----
TT=T[T['taught']==True].copy()
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

# ---- pseudonymize teacher ----
M=M.sort_values(['arch','n_eleves_uniq'],ascending=[True,False]).reset_index(drop=True)
M['pseudo']=['T%03d'%i for i in range(len(M))]
cols=['pseudo','arch','behavior','n_eleves_uniq','n_sessions','n_activities_taught','n_tests',
 'n_sy_taught','returned','returned_next_year','eligible_return','entry_sy','entry_month',
 'entry_activity','entry_act_label','y1_sess','y1_el','y1_act','y1_max_sess',
 'uai','type_etab','secteur','academie','departement','commune','ips','ips_bucket',
 'n_prof_uai','site_present','etab_formed','form_month',
 'taught_2425','taught_2526','active_2324','active_2425','active_2526']
M[cols].to_csv(f"{OUT}/master_teachers.csv",index=False)
print("wrote master_teachers.csv:",M.shape)
print("\n== archetype counts =="); print(M['arch'].value_counts())
print("\n== entry cohort =="); print(M['entry_sy'].value_counts())
print("\n== eligible_return =="); print(M['eligible_return'].value_counts())
print("\n== returned_next_year (eligible only) ==")
print(M[M['eligible_return']]['returned_next_year'].value_counts(dropna=False))
print("\nsession-grain class size: median",S['n_eleves'].median(),"mean",round(S['n_eleves'].mean(),1))
print("teacher-grain unique pupils: median",M['n_eleves_uniq'].median())