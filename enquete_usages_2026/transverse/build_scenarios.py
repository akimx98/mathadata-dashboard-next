#!/usr/bin/env python3
"""COMMONS — usage-scenario substrate: per-session temporal enrichment + per-teacher
scenario signatures (soutien, demi-groupe, déploiement, reprise, travail maison,
marathon, one-shot) + sub-cohort tags. Feeds the scenario investigation.
All teacher/pupil ids are hashes; output keeps pseudonyms + establishment grain only.
"""
import pandas as pd, numpy as np, json, os
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
BASE=_ENQ
OUT=f"{BASE}/transverse/data"
DEMO, PIO = K.DEMO, K.PIO
S=pd.read_csv(f"{BASE}/usage-capytale/data/sessions.csv")
U=pd.read_csv(f"{BASE}/usage-capytale/data/usages_enriched.csv")
S=S[~S['teacher'].isin([DEMO,PIO])].copy(); U=U[~U['teacher'].isin([DEMO,PIO])].copy()  # exclusion canonique dès la source
M=pd.read_csv(f"{OUT}/master_teachers.csv")

S['start']=pd.to_datetime(S['start'],utc=True,errors='coerce').dt.tz_convert('Europe/Paris')
S['hour']=S['start'].dt.hour; S['wd']=S['start'].dt.dayofweek
S['date']=pd.to_datetime(S['date'],errors='coerce')
def slot(h):
    if pd.isna(h): return 'na'
    if h<8: return 'tot_matin'
    if h<12: return 'matin'
    if h<14: return 'dejeuner'
    if h<18: return 'aprem'
    return 'soir'
S['slot']=S['hour'].apply(slot)
S['wd_slot']=S['wd'].astype('Int64').astype(str)+'_'+S['slot']

# student-level reprise / home work
st=U[U['role']=='student'].copy()
st['cre']=pd.to_datetime(st['created_dt'],utc=True,errors='coerce').dt.tz_convert('Europe/Paris')
st['chg']=pd.to_datetime(st['changed_dt'],utc=True,errors='coerce').dt.tz_convert('Europe/Paris')
st['gap_h']=(st['chg']-st['cre']).dt.total_seconds()/3600
st['reprise']=st['gap_h']>=12
st['home']=(st['chg'].dt.dayofweek>=5)|(st['chg'].dt.hour>=18)|(st['chg'].dt.hour<7)
rep=st.groupby('teacher')['reprise'].sum().rename('n_reprise_pupils')
hom=st.groupby('teacher')['home'].sum().rename('n_home_pupils')

# per-pupil work duration (min) & continuation (>60min) — engagement texture (cf export_csv_by_teacher.js)
st['work_min']=(st['chg']-st['cre']).dt.total_seconds()/60
st['continued']=st['work_min']>60
eng=st.groupby('teacher').agg(med_work_min=('work_min','median'),
    continuation_rate=('continued','mean')).reset_index()

# multi-class vs same-class: greedy clustering of sessions by student-set overlap (cf overlap_rate)
def n_classes(g):
    # g: rows for one teacher with session_id + student
    sess=g.dropna(subset=['session_id']).groupby('session_id')['student'].apply(set)
    if len(sess)==0: return (0,False)
    # order by nothing in particular; greedy assign to a class if overlap>0.5 with its union
    classes=[]
    for s in sess:
        placed=False
        for c in classes:
            inter=len(s & c['u']); denom=max(len(s),len(c['u'])) or 1
            if inter/denom>0.5:
                c['u']|=s; placed=True; break
        if not placed: classes.append({'u':set(s)})
    return (len(classes), len(classes)>=2)
nc=st.groupby('teacher').apply(lambda g: pd.Series(dict(zip(['n_classes','uses_multi_class'],n_classes(g))))).reset_index()

# per-teacher scenario signature
rows=[]
for tid,g in S.groupby('teacher'):
    days=g['date'].dt.date.nunique()
    spread=(g['date'].max()-g['date'].min()).days
    dom_slot=g['slot'].mode().iat[0] if len(g) else 'na'
    fixed=g['wd_slot'].value_counts().iat[0] if len(g) else 0    # most-repeated weekday+slot
    demidays=int((g.groupby(g['date'].dt.date).size()>=2).sum())
    rows.append(dict(teacher=tid,n_sessions=len(g),n_days=days,spread_days=spread,n_acts=g['mathadata_id'].nunique(),
        med_size=float(g['n_eleves'].median()),max_size=int(g['n_eleves'].max()),
        pct_small=float((g['n_eleves']<=5).mean()),pct_full=float((g['n_eleves']>=15).mean()),
        med_span=float(g['span_min'].median()),
        dom_slot=dom_slot,fixed_slot_n=int(fixed),demigroupe_days=demidays,
        pct_weekend=float((g['wd']>=5).mean()),pct_evening=float((g['hour']>=18).mean())))
SC=(pd.DataFrame(rows).merge(rep,on='teacher',how='left').merge(hom,on='teacher',how='left')
    .merge(eng,on='teacher',how='left').merge(nc,on='teacher',how='left'))
SC[['n_reprise_pupils','n_home_pupils']]=SC[['n_reprise_pupils','n_home_pupils']].fillna(0).astype(int)
SC['med_work_min']=SC['med_work_min'].fillna(0).round(1)
SC['continuation_rate']=SC['continuation_rate'].fillna(0).round(3)
SC['n_classes']=SC['n_classes'].fillna(0).astype(int)
SC['uses_multi_class']=SC['uses_multi_class'].fillna(False).astype(bool)

# primary scenario (priority order, transparent)
def scenario(r):
    if r['n_sessions']==1: return 'one_shot'
    if r['n_sessions']>=3 and r['med_size']<=5 and r['fixed_slot_n']>=3: return 'soutien_recurrent'
    if r['demigroupe_days']>=2 and r['max_size']>=8: return 'demi_groupe'
    if r['spread_days']>=120: return 'marathon'
    if r['n_sessions']>=8 and r['spread_days']<90: return 'intensif_court'
    if r['max_size']>=15: return 'deploiement_classe'
    return 'ponctuel_petit'
SC['scenario']=SC.apply(scenario,axis=1)

# merge archetype/retention/establishment from master (need teacher->pseudo map: rebuild from teachers.csv hash)
T=pd.read_csv(f"{BASE}/usage-capytale/data/teachers.csv")[['teacher','uai','academie','commune','ips','n_prof_uai' if False else 'uai']]
# master has uai/academie but pseudonymized; re-key master by reconstructing same archetype on teachers.csv
# Simplest: attach archetype by matching on the behavioural tuple via teachers.csv -> recompute pseudo mapping
# We instead re-load master raw join key: master rows are sorted; rebuild mapping from teachers.csv directly
DEMO, PIO = K.DEMO, K.PIO
TT=pd.read_csv(f"{BASE}/usage-capytale/data/teachers.csv")
TT=TT[(TT['taught']==True) & (~TT['teacher'].isin([DEMO,PIO]))].copy()   # même exclusion canonique que master
for c in ['n_eleves_uniq','n_sessions','n_activities_taught','n_tests','n_sy_taught']:
    TT[c]=pd.to_numeric(TT[c],errors='coerce')
def arch(r):
    intense=(r['n_sessions']>=6) or (r['n_activities_taught']>=3) or (r['n_tests']>=3 and r['n_sessions']>=4)
    if intense: return 'pionnier_intensif'
    if r['n_sy_taught']>=2: return 'fidele_pluriannuel'
    if r['n_eleves_uniq']<=8 and r['n_sessions']<=2: return 'petit_groupe'
    if r['n_activities_taught']>=2: return 'explorateur_multi'
    return 'deployeur_classe'
TT['arch']=TT.apply(arch,axis=1)
# entry year from sessions (min school-year taught)
entry=S.groupby('teacher')['sy'].min().rename('entry_sy')
TT=TT.merge(entry,on='teacher',how='left')
TT['eligible_return']=TT['entry_sy'].isin(['2023-2024','2024-2025'])
def ret_next(r):
    if r['entry_sy']=='2023-2024': return bool(r.get('active_2425',False) or r['taught_2425'])
    if r['entry_sy']=='2024-2025': return bool(r['taught_2526'])
    return None
TT['returned_next_year']=TT.apply(ret_next,axis=1)
key=TT[['teacher','arch','uai','academie','commune','ips','n_eleves_uniq','n_sy_taught',
        'entry_sy','eligible_return','returned_next_year']]
SC=SC.merge(key,on='teacher',how='left')

# pseudonymize: canonical (arch, reach desc, hash tiebreaker) -> identical to build_master
SC=SC.sort_values(['arch','n_eleves_uniq','teacher'],ascending=[True,False,True]).reset_index(drop=True)
SC['pseudo']=['T%03d'%i for i in range(len(SC))]

cols=['pseudo','arch','scenario','n_sessions','n_days','spread_days','n_acts','med_size','max_size',
 'pct_small','pct_full','med_span','med_work_min','continuation_rate','n_classes','uses_multi_class',
 'dom_slot','fixed_slot_n','demigroupe_days','pct_weekend','pct_evening',
 'n_reprise_pupils','n_home_pupils','n_eleves_uniq','n_sy_taught','entry_sy','eligible_return','returned_next_year',
 'academie','commune','ips','uai']
SC[cols].to_csv(f"{OUT}/scenarios_teachers.csv",index=False)
print("wrote scenarios_teachers.csv:",SC.shape)
print("\n== scenario x archetype ==")
print(pd.crosstab(SC['scenario'],SC['arch']).to_string())
print("\n== temporal rhythm (sessions) ==")
print(S['slot'].value_counts().to_dict())

facts=dict(
  n_sessions=len(S),
  rhythm={k:int(v) for k,v in S['slot'].value_counts().items()},
  weekend_pct=round(100*(S['wd']>=5).mean(),1), evening_pct=round(100*(S['hour']>=18).mean(),1),
  span_median=round(float(S['span_min'].median()),1), span_le15_pct=round(100*(S['span_min']<=15).mean()), span_ge45_pct=round(100*(S['span_min']>=45).mean()),
  scenario_counts={k:int(v) for k,v in SC['scenario'].value_counts().items()},
  reprise_rows=int(st['reprise'].sum()), reprise_pct=round(100*st['reprise'].mean(),1), reprise_teachers=int((SC['n_reprise_pupils']>0).sum()),
  home_rows=int(st['home'].sum()), home_pct=round(100*st['home'].mean(),1), home_teachers=int((SC['n_home_pupils']>0).sum()),
  demigroupe_teachers=int((SC['demigroupe_days']>=2).sum()),
  multi_class_teachers=int(SC['uses_multi_class'].sum()), multi_class_pct=round(100*SC['uses_multi_class'].mean(),1),
  median_classes_per_teacher=float(SC['n_classes'].median()),
  pupil_med_work_min=round(float(st['work_min'].median()),1),
  pupil_continuation_pct=round(100*st['continued'].mean(),1),
)
json.dump(facts,open(f"{OUT}/facts_scenarios.json","w"),ensure_ascii=False,indent=1)
print("\nwrote facts_scenarios.json")
# also write session-enriched (pseudonymised teacher) for workflow temporal analysis
Sx=S.merge(SC[['teacher','pseudo','arch','scenario']],on='teacher',how='left')
Sx[['pseudo','arch','scenario','mathadata_id','act_label','n_eleves','date','hour','wd','slot','span_min','sy']].to_csv(f"{OUT}/sessions_enriched.csv",index=False)
print("wrote sessions_enriched.csv:",Sx.shape)
