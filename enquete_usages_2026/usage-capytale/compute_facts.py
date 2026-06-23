#!/usr/bin/env python3
"""Calcule l'ensemble des faits analytiques -> facts.json. Source unique de vérité chiffrée."""
import pandas as pd, numpy as np, json
D="/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/usage-capytale/data"
BASE="/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data"

df=pd.read_csv(f"{D}/usages_enriched.csv", dtype=str, keep_default_na=False)
te=pd.read_csv(f"{D}/teachers.csv")
sess=pd.read_csv(f"{D}/sessions.csv")
ann=pd.read_csv(f"{BASE}/annuaire_etablissements.csv", dtype=str, keep_default_na=False)
ann['ips_num']=pd.to_numeric(ann['ips'],errors='coerce')

DEMO='c81e728d9d4c2f636f067f89cc14862c'  # compte rôle-vide
PIONEER='cfcd208495d565ef66e7dff9f98764da'  # id séquentiel "0"
for c in ['created']:
    df[c]=pd.to_numeric(df[c],errors='coerce')
df['created_dt']=pd.to_datetime(df['created'],unit='s',utc=True).dt.tz_convert('Europe/Paris')

# univers "réel" = hors compte démo
real=df[df['teacher']!=DEMO].copy()
tr=te[te['teacher']!=DEMO].copy()
for b in ['tested','taught','active_2324','active_2425','active_2526','taught_2425','taught_2526']:
    tr[b]=tr[b].astype(bool)
for n in ['n_tests','n_eleves','n_eleves_uniq','n_sessions','n_activities','n_activities_taught','ips','n_sy_taught','days_test_to_teach']:
    tr[n]=pd.to_numeric(tr[n],errors='coerce')

F={}
def pct(a,b): return round(100*a/b,1) if b else None

# ---------- 0. OVERVIEW ----------
F['overview']={
 'extraction_date':'2026-06-19',
 'n_rows_total':len(df), 'n_rows_real':len(real),
 'n_student_rows':int((real['role']=='student').sum()),
 'n_teacher_rows':int((real['role']=='teacher').sum()),
 'n_emptyrole_rows':int((df['role']=='').sum()),
 'n_teachers':int(tr['teacher'].nunique()),
 'n_students_uniq':int(real[real['role']=='student']['student'].nunique()),
 'n_activities':int(real['mathadata_id'].nunique()),
 'n_etabs_with_uai':int(tr[tr['uai'].astype(str)!='nan']['uai'].nunique()),
 'date_min':str(real['created_dt'].min()), 'date_max':str(real['created_dt'].max()),
 'n_sessions':len(sess), 'n_classes_ge10':int((sess['n_eleves']>=10).sum()),
 'note_demo':'195 lignes rôle-vide = compte unique c81e728d (MD5 "2"), exclu des KPI',
 'note_pioneer':'cfcd2084 (MD5 "0") = compte pionnier historique, 404 élèves, Haubourdin/Lille, actif 2023-26',
}

# ---------- 1. CROISSANCE ----------
def sy_split(d):
    sy=d.year if d.month>=8 else d.year-1; return f"{sy}-{sy+1}"
real['sy']=real['created_dt'].apply(sy_split)
real['ym']=real['created_dt'].dt.strftime('%Y-%m')
g_sy=real.groupby(['sy','role']).size().unstack(fill_value=0)
F['growth']={
 'usages_by_sy':{sy:{'student':int(row.get('student',0)),'teacher':int(row.get('teacher',0)),
                     'total':int(row.sum())} for sy,row in g_sy.iterrows()},
 'monthly':{ym:int(n) for ym,n in real.groupby('ym').size().items()},
 'monthly_student':{ym:int(n) for ym,n in real[real['role']=='student'].groupby('ym').size().items()},
}
# profs actifs (enseignant) par année + nouveaux
for sy in ['2023-2024','2024-2025','2025-2026']:
    profs_taught=set(real[(real['role']=='student')&(real['sy']==sy)]['teacher'])
    F['growth'].setdefault('teaching_profs_by_sy',{})[sy]=len(profs_taught)
# nouveaux profs 2025-26
taught_2425=set(real[(real['role']=='student')&(real['sy']=='2024-2025')]['teacher'])
taught_2526=set(real[(real['role']=='student')&(real['sy']=='2025-2026')]['teacher'])
taught_2324=set(real[(real['role']=='student')&(real['sy']=='2023-2024')]['teacher'])
F['growth']['retention']={
 'taught_2425':len(taught_2425),'taught_2526':len(taught_2526),
 'retained_2425_to_2526':len(taught_2425 & taught_2526),
 'retention_rate':pct(len(taught_2425&taught_2526),len(taught_2425)),
 'new_in_2526':len(taught_2526 - taught_2425 - taught_2324),
 'new_in_2526_share':pct(len(taught_2526-taught_2425-taught_2324),len(taught_2526)),
}
# croissance par activité (élèves) sy
act_sy=real[real['role']=='student'].groupby(['act_label','sy']).size().unstack(fill_value=0)
F['growth']['student_by_activity_sy']={a:{sy:int(act_sy.loc[a,sy]) for sy in act_sy.columns} for a in act_sy.index}
# par niveau
lvl_sy=real[real['role']=='student'].groupby(['act_level','sy']).size().unstack(fill_value=0)
F['growth']['student_by_level_sy']={a:{sy:int(lvl_sy.loc[a,sy]) for sy in lvl_sy.columns} for a in lvl_sy.index}
# par thème
th_sy=real[real['role']=='student'].groupby(['act_theme','sy']).size().unstack(fill_value=0)
F['growth']['student_by_theme_sy']={a:{sy:int(th_sy.loc[a,sy]) for sy in th_sy.columns} for a in th_sy.index}

# ---------- 2. PATTERNS D'USAGE ----------
behv=tr['behavior'].value_counts().to_dict()
F['usage_patterns']={
 'behavior_counts':{k:int(v) for k,v in behv.items()},
 'taught_total':int(tr['taught'].sum()),
 'tested_before_teaching':int((tr['behavior']=='testé_puis_enseigné').sum()),
 'taught_without_prior_test':int(tr['taught'].sum()-(tr['behavior']=='testé_puis_enseigné').sum()),
 'tested_never_taught':int((tr['behavior']=='testé_seulement').sum()),
}
# funnel test->teach par activité (grain teacher x activity)
rows=[]
ra=real[real['mathadata_id']!='']
for mid,gg in ra.groupby('mathadata_id'):
    lab=gg['act_label'].iloc[0]
    tested=set(gg[gg['role']=='teacher']['teacher'])
    taught=set(gg[gg['role']=='student']['teacher'])
    rows.append(dict(activity=lab, mathadata_id=mid,
        n_profs_tested=len(tested), n_profs_taught=len(taught),
        n_tested_then_taught=len(tested & taught),
        conv_rate=pct(len(tested&taught),len(tested)),
        n_taught_no_test=len(taught - tested),
        n_student_rows=int((gg['role']=='student').sum())))
F['usage_patterns']['activity_funnel']=sorted(rows,key=lambda x:-x['n_student_rows'])
# petit groupe puis classe entière : pour chaque (teacher) regarder séquence des séances >=1
sess2=sess[sess['teacher']!=DEMO].copy().sort_values('start')
small_then_big=0; profs_multi_sess=0
for tid,gg in sess2.groupby('teacher'):
    gg=gg.sort_values('start')
    if len(gg)>=2:
        profs_multi_sess+=1
        sizes=gg['n_eleves'].tolist()
        # un petit (<=6) avant un grand (>=10) plus tard
        for i in range(len(sizes)):
            if sizes[i]<=6 and any(s>=10 for s in sizes[i+1:]):
                small_then_big+=1; break
F['usage_patterns']['profs_multi_sessions']=profs_multi_sess
F['usage_patterns']['profs_small_then_big']=small_then_big
# délai test->enseignement (jours) pour testé_puis_enseigné
d=tr[tr['behavior']=='testé_puis_enseigné']['days_test_to_teach'].dropna()
F['usage_patterns']['delay_test_to_teach_days']={'median':round(float(d.median()),1),'mean':round(float(d.mean()),1),
   'same_day_share':pct(int((d<1).sum()),len(d)),'within_7d':pct(int((d<=7).sum()),len(d))}

# ---------- 3. DYNAMIQUE LOCALE (établissements) ----------
est=tr[tr['uai'].astype(str)!='nan'].copy()
est=est[est['uai']!='']
by_uai=est.groupby('uai')
n_profs_per_etab=by_uai['teacher'].nunique()
F['local_dynamics']={
 'n_etabs':int(est['uai'].nunique()),
 'etabs_1_prof':int((n_profs_per_etab==1).sum()),
 'etabs_2_profs':int((n_profs_per_etab==2).sum()),
 'etabs_3plus_profs':int((n_profs_per_etab>=3).sum()),
 'max_profs_in_etab':int(n_profs_per_etab.max()),
}
# diffusion: dans les étabs multi-profs, les profs ont-ils démarré la même année ou non ?
multi=n_profs_per_etab[n_profs_per_etab>=2].index
same_year=0; diff_year=0
real_taught=real[real['role']=='student']
for uai in multi:
    profs=est[est['uai']==uai]['teacher'].unique()
    first_years={}
    for p in profs:
        d0=real_taught[real_taught['teacher']==p]['created_dt'].min()
        if pd.notna(d0): first_years[p]=sy_split(d0)
    yrs=set(first_years.values())
    if len(yrs)>=2: diff_year+=1
    elif len(yrs)==1: same_year+=1
F['local_dynamics']['multiprof_same_launch_year']=same_year
F['local_dynamics']['multiprof_staggered_launch']=diff_year
# partage de code: un activity_id utilisé par des élèves rattachés à >1 teacher
shar=real[real['role']=='student'].groupby('activity_id')['teacher'].nunique()
F['local_dynamics']['activity_codes_shared_multi_teacher']=int((shar>=2).sum())
F['local_dynamics']['activity_codes_total']=int(len(shar))

# ---------- 4. PROFILS ÉTABLISSEMENTS ----------
# national lycée IPS baseline
lyc=ann[ann['type_etablissement']=='lycee']
nat_lyc_ips=lyc['ips_num'].dropna()
user_uais=set(est['uai'])
user_lyc=est[est['type_etab']=='lycee']
F['establishment_profiles']={
 'profs_by_type':{k:int(v) for k,v in tr['type_etab'].replace('','(inconnu)').fillna('(inconnu)').value_counts().items()},
 'students_by_type':{k:int(v) for k,v in tr.groupby(tr['type_etab'].replace('','(inconnu)').fillna('(inconnu)'))['n_eleves_uniq'].sum().items()},
 'profs_by_secteur':{k:int(v) for k,v in tr['secteur'].replace('','(inconnu)').fillna('(inconnu)').value_counts().items()},
 'ips_user_lycees':{'n':int(user_lyc['ips'].notna().sum()),'mean':round(float(pd.to_numeric(user_lyc['ips'],errors='coerce').mean()),1),
                    'median':round(float(pd.to_numeric(user_lyc['ips'],errors='coerce').median()),1)},
 'ips_national_lycees':{'n':int(nat_lyc_ips.shape[0]),'mean':round(float(nat_lyc_ips.mean()),1),'median':round(float(nat_lyc_ips.median()),1)},
 'ips_user_quartiles':[round(float(x),1) for x in pd.to_numeric(user_lyc['ips'],errors='coerce').dropna().quantile([.25,.5,.75]).tolist()],
 'ips_national_quartiles':[round(float(x),1) for x in nat_lyc_ips.quantile([.25,.5,.75]).tolist()],
}
# académies / départements (élèves uniques et profs)
ac=est.groupby('academie').agg(n_profs=('teacher','nunique'),n_eleves=('n_eleves_uniq','sum'),n_sessions=('n_sessions','sum')).sort_values('n_eleves',ascending=False)
F['establishment_profiles']['by_academie']={a:{'n_profs':int(r.n_profs),'n_eleves':int(r.n_eleves),'n_sessions':int(r.n_sessions)} for a,r in ac.iterrows()}
dep=est.groupby('departement').agg(n_profs=('teacher','nunique'),n_eleves=('n_eleves_uniq','sum')).sort_values('n_eleves',ascending=False).head(15)
F['establishment_profiles']['top_departements']={a:{'n_profs':int(r.n_profs),'n_eleves':int(r.n_eleves)} for a,r in dep.iterrows()}
F['establishment_profiles']['n_academies']=int(est['academie'].nunique())
F['establishment_profiles']['n_departements']=int(est['departement'].nunique())

# ---------- 5. TESTÉ JAMAIS ENSEIGNÉ (non convertis) ----------
to=tr[tr['behavior']=='testé_seulement'].copy()
allp=tr
def share_table(sub,col):
    return {k:int(v) for k,v in sub[col].replace('','(inconnu)').fillna('(inconnu)').value_counts().items()}
# activités testées par les non-convertis
to_acts=real[(real['role']=='teacher')&(real['teacher'].isin(set(to['teacher'])))]['act_label'].value_counts()
F['tested_not_adopted']={
 'n':len(to),
 'by_type':share_table(to,'type_etab'),
 'by_secteur':share_table(to,'secteur'),
 'by_academie':share_table(to,'academie'),
 'by_sy_active':share_table(to,'sy_active'),
 'tested_activities':{k:int(v) for k,v in to_acts.items()},
 'median_n_tests':float(to['n_tests'].median()),
 'pioneer_baseline_type_share':{k:round(float(v),3) for k,v in tr['type_etab'].replace('','(inconnu)').fillna('(inconnu)').value_counts(normalize=True).items()},
}

# ---------- 6. POWER USERS ----------
trs=tr.sort_values('n_eleves_uniq',ascending=False)
tot_stud=tr['n_eleves_uniq'].sum()
top10=trs.head(10)['n_eleves_uniq'].sum()
top20=trs.head(20)['n_eleves_uniq'].sum()
def gini(x):
    x=np.sort(np.array(x,dtype=float)); n=len(x)
    if n==0 or x.sum()==0: return None
    return round(float((2*np.sum((np.arange(1,n+1))*x)/(n*x.sum()))-(n+1)/n),3)
F['power_users']={
 'top10_share_students':pct(int(top10),int(tot_stud)),
 'top20_share_students':pct(int(top20),int(tot_stud)),
 'gini_students_per_teacher':gini(tr['n_eleves_uniq'].values),
 'gini_sessions_per_teacher':gini(tr['n_sessions'].values),
 'top15':[{'teacher':r.teacher[:8],'is_pioneer':r.teacher==PIONEER,'type':r.type_etab,'academie':r.academie,
           'commune':r.commune,'n_eleves_uniq':int(r.n_eleves_uniq),'n_sessions':int(r.n_sessions),
           'n_tests':int(r.n_tests),'n_activities':int(r.n_activities),'behavior':r.behavior,'sy_active':r.sy_active}
          for r in trs.head(15).itertuples()],
 'median_students_per_teacher':float(tr[tr['taught']]['n_eleves_uniq'].median()),
 'mean_students_per_teacher':round(float(tr[tr['taught']]['n_eleves_uniq'].mean()),1),
}

# ---------- 7. DYNAMIQUE TEMPORELLE ----------
F['temporal']={
 'n_sy_taught_dist':{int(k):int(v) for k,v in tr[tr['taught']]['n_sy_taught'].value_counts().sort_index().items()},
 'profs_taught_1y':int((tr[tr['taught']]['n_sy_taught']==1).sum()),
 'profs_taught_2y':int((tr[tr['taught']]['n_sy_taught']==2).sum()),
 'profs_taught_3y':int((tr[tr['taught']]['n_sy_taught']==3).sum()),
}
# nb de séances par prof (intensité)
F['temporal']['sessions_per_teacher_dist']={
 '1':int((tr[tr['taught']]['n_sessions']==1).sum()),
 '2-3':int(((tr[tr['taught']]['n_sessions']>=2)&(tr[tr['taught']]['n_sessions']<=3)).sum()),
 '4-9':int(((tr[tr['taught']]['n_sessions']>=4)&(tr[tr['taught']]['n_sessions']<=9)).sum()),
 '10+':int((tr[tr['taught']]['n_sessions']>=10).sum()),
}
# saisonnalité: mois de l'année (sessions classes >=10)
cl=sess[(sess['n_eleves']>=10)&(sess['teacher']!=DEMO)].copy()
cl['start_dt']=pd.to_datetime(cl['start'],utc=True).dt.tz_convert('Europe/Paris')
cl['month']=cl['start_dt'].dt.month
F['temporal']['classes_by_month']={int(m):int(n) for m,n in cl.groupby('month').size().items()}
# jour de semaine
cl['dow']=cl['start_dt'].dt.dayofweek
F['temporal']['classes_by_dow']={int(m):int(n) for m,n in cl.groupby('dow').size().items()}

with open(f"{D}/facts.json","w") as f:
    json.dump(F,f,ensure_ascii=False,indent=1,default=str)
print("facts.json écrit.")
print(json.dumps({k:(v if not isinstance(v,dict) else list(v.keys())) for k,v in F.items()},ensure_ascii=False,indent=1))
print("\nGROWTH usages_by_sy:", F['growth']['usages_by_sy'])
print("RETENTION:", F['growth']['retention'])
print("IPS user vs nat lycées:", F['establishment_profiles']['ips_user_lycees'], F['establishment_profiles']['ips_national_lycees'])
print("LOCAL:", F['local_dynamics'])
print("POWER top10 share:", F['power_users']['top10_share_students'], "gini:", F['power_users']['gini_students_per_teacher'])
