#!/usr/bin/env python3
"""
VOLET 2 — Croisement mathadata.fr (payload, nominatif) x Capytale (usage, anonyme).

Construit la couche canonique cote SITE depuis le snapshot payload (gitignore, PII).
- Lit le snapshot (PII) ; n'ecrit AUCUN nom/email dans les sorties versionnees.
- Tables de travail nominatives  -> SCRATCH (session, non versionne)
- Tables agregees / pseudonymisees -> volet2/data (versionne)

Pont site<->Capytale : consultation_rss.file == 'capytale2.ac-paris.fr/web/b/<id>'
  ou  <id> == mathadata_id cote Capytale. Idem events resource_download resourceType=='capytale'.
Quirks: 9 comptes exclude_from_analytics ; date formation sentinelle '1984-01-01T12:00:00Z' (=> manquante).
Types de formation : 'presentiel' (en etab) et 'webdecouv' (webinaire decouverte).
"""
import json, re, csv, os
import pandas as pd, numpy as np
from datetime import datetime

SNAP="/Users/akim/Documents/MathAData_Git/mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z"
BASE="/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data"
OUT ="/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/volet2/data"
SCRATCH="/private/tmp/claude-502/-Users-akim-Documents-MathAData-Git-mathadata-dashboard-next/49f4f306-c2bb-43a0-af8f-f1b5ce99e908/scratchpad"
os.makedirs(SCRATCH, exist_ok=True); os.makedirs(OUT, exist_ok=True)
DEMO='c81e728d9d4c2f636f067f89cc14862c'; PIO='cfcd208495d565ef66e7dff9f98764da'
SENTINEL='1984-01-01'
CAP_RE=re.compile(r'web/b/(\d+)')

def to_dt(s):
    return pd.to_datetime(s, utc=True, errors='coerce')
def sy(d):
    if pd.isna(d): return 'NA'
    y=d.year if d.month>=8 else d.year-1; return f"{y}-{y+1}"

# ---------- annuaire ----------
ann=pd.read_csv(f"{BASE}/annuaire_etablissements.csv",dtype=str,keep_default_na=False)
A={r['uai']:r for _,r in ann.iterrows()}
def aget(u,k): return A.get(u,{}).get(k,'') if u else ''

# ---------- payload users ----------
users=json.load(open(f"{SNAP}/users.json"))
U=pd.DataFrame(users)
U['createdAt']=to_dt(U['createdAt']); U['updatedAt']=to_dt(U['updatedAt'])
U['last_login']=to_dt(U['last_login'])
U['fdate']=to_dt(U['trainedDateFormation'])
U.loc[U['fdate'].dt.strftime('%Y-%m-%d')==SENTINEL,'fdate']=pd.NaT  # drop sentinel
U['exclude']=U['exclude_from_analytics'].fillna(False).astype(bool)
U['is_formed']=U['statut'].isin(['forme','mentor'])
U['ftype']=U['trainedTypeFormation'].where(U['trainedTypeFormation'].isin(['presentiel','webdecouv']),None)
U['uai']=U['uai'].fillna('')
U['acad']=U['academie'].fillna('')
# etab enrich
U['etab_type']=U['uai'].map(lambda u: aget(u,'type_etablissement'))
U['etab_secteur']=U['uai'].map(lambda u: aget(u,'secteur'))
U['etab_dep']=U['uai'].map(lambda u: aget(u,'departement'))
U['etab_ips']=U['uai'].map(lambda u: aget(u,'ips'))
U['etab_commune']=U['uai'].map(lambda u: aget(u,'commune'))
U['acct_month']=U['createdAt'].dt.tz_convert('Europe/Paris').dt.strftime('%Y-%m')
U['fmonth']=U['fdate'].dt.tz_convert('Europe/Paris').dt.strftime('%Y-%m')

# ---------- events / sessions / consultation_rss ----------
events=json.load(open(f"{SNAP}/events.json"))
EV=pd.DataFrame(events); EV['createdAt']=to_dt(EV['createdAt'])
def md_get(m,k):
    return (m or {}).get(k)
EV['moduleName']=EV['metadata'].map(lambda m: md_get(m,'moduleName'))
EV['resourceUrl']=EV['metadata'].map(lambda m: md_get(m,'resourceUrl'))
EV['resourceType']=EV['metadata'].map(lambda m: md_get(m,'resourceType'))
EV['videoTitle']=EV['metadata'].map(lambda m: md_get(m,'videoTitle'))

rss=json.load(open(f"{SNAP}/consultation_rss.json"))
R=pd.DataFrame(rss); R['createdAt']=to_dt(R['createdAt'])
R['cap_id']=R['file'].map(lambda f: (CAP_RE.search(f).group(1) if isinstance(f,str) and 'web/b/' in f else None))
R['is_cap']=R['cap_id'].notna()

sess=json.load(open(f"{SNAP}/sessions.json"))
S=pd.DataFrame(sess)

# exclude team/test accounts from per-user analytics
excl=set(U.loc[U['exclude'],'id'])

# ---------- per-user activity rollups ----------
def per_user(df, col='user'):
    d=df[df[col].notna() & ~df[col].isin(excl)]
    return d
mv=per_user(EV[EV['eventType']=='module_view'])
vv=per_user(EV[EV['eventType']=='video_view'])
rc=per_user(R)                                   # consultation_rss = clics ressources (source privilegiee)
capc=per_user(R[R['is_cap']])                    # clics capytale
ses=per_user(S)

g_mv=mv.groupby('user').agg(n_module_views=('id','size'), first_mv=('createdAt','min')).reset_index()
g_vv=vv.groupby('user').agg(n_video_views=('id','size')).reset_index()
g_rc=rc.groupby('user').agg(n_res_clicks=('id','size'), first_rc=('createdAt','min')).reset_index()
g_cap=capc.groupby('user').agg(n_cap_clicks=('id','size'), first_cap=('createdAt','min'),
                               cap_acts=('cap_id', lambda s: ','.join(sorted(set(s))))).reset_index()
g_ses=ses.groupby('user').agg(n_sessions=('id','size')).reset_index()

UU=U.merge(g_mv,left_on='id',right_on='user',how='left').drop(columns=['user'])
for g in (g_vv,g_rc,g_cap,g_ses):
    UU=UU.merge(g,left_on='id',right_on='user',how='left').drop(columns=['user'])
for c in ['n_module_views','n_video_views','n_res_clicks','n_cap_clicks','n_sessions']:
    UU[c]=UU[c].fillna(0).astype(int)
UU['clicked_cap']=UU['n_cap_clicks']>0
UU['viewed_module']=UU['n_module_views']>0
UU['clicked_res']=UU['n_res_clicks']>0
UU['active']=UU['viewed_module']|UU['clicked_res']|(UU['n_video_views']>0)

# ---------- Capytale usage par UAI ----------
cap=pd.read_csv(f"{BASE}/capytale_fresh_20260619.csv",dtype=str,keep_default_na=False)
cap=cap[cap['teacher']!=DEMO].copy()
cap['role']=cap['role'].str.strip().str.lower()
cap['dt']=to_dt(pd.to_numeric(cap['created'],errors='coerce'),)  # epoch sec
cap['dt']=pd.to_datetime(pd.to_numeric(cap['created'],errors='coerce'),unit='s',utc=True)
cap['sy']=cap['dt'].dt.tz_convert('Europe/Paris').apply(sy)
stud=cap[cap['role']=='student']; teach=cap[cap['role']=='teacher']

def cap_by_uai(uai_col):
    rows=[]
    for u,grp in cap.groupby(uai_col):
        if not u.strip(): continue
        sg=grp[grp['role']=='student']; tg=grp[grp['role']=='teacher']
        rows.append(dict(uai=u, n_pupils=sg['student'].nunique(), n_pupil_rows=len(sg),
            n_teacher_clones=len(tg), n_teacher_accounts=tg['teacher'].nunique(),
            first_dt=grp['dt'].min(), last_dt=grp['dt'].max(),
            acts=','.join(sorted(set(grp['mathadata_id']))),
            sy_list=','.join(sorted(set(grp['sy'])))))
    return pd.DataFrame(rows)
CU_teach=cap_by_uai('uai_teach')
CU_el=cap_by_uai('uai_el')
CU_teach.to_csv(f"{OUT}/capytale_by_uai_teach.csv",index=False)
CU_el.to_csv(f"{OUT}/capytale_by_uai_el.csv",index=False)

# ---------- save working (PII-free: id only, no name/email) ----------
UU=UU[~UU['exclude']].copy()   # retirer les comptes equipe/test (exclude_from_analytics)
keep=['id','statut','is_formed','ftype','fdate','fmonth','createdAt','acct_month',
      'newsletter','newsletter_only','acad','uai','etab_type','etab_secteur','etab_dep',
      'etab_ips','etab_commune','hors_lycee','lycee_ville','last_login',
      'n_sessions','n_module_views','n_video_views','n_res_clicks','n_cap_clicks',
      'cap_acts','first_mv','first_rc','first_cap','clicked_cap','viewed_module','clicked_res','active']
W=UU[keep].copy()
W.to_csv(f"{SCRATCH}/payload_users_work.csv",index=False)
print("users:",len(UU),"| excluded:",len(excl),"| formed:",int(UU['is_formed'].sum()),
      "| clicked_cap:",int(UU['clicked_cap'].sum()))
print("capytale uai_teach groups:",len(CU_teach),"| uai_el groups:",len(CU_el))
print("wrote working table ->",f"{SCRATCH}/payload_users_work.csv")
