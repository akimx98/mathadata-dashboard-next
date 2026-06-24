#!/usr/bin/env python3
"""
VOLET 2 (bonus) — appariement individuel site (nominatif) <-> compte Capytale (anonyme).
Strategie : aucun identifiant commun -> inference par (UAI + activite + timing clic->clone).

Signaux, du + fort au + faible :
  A (haute)   : un user site a clique l'activite A a l'instant T ; il existe UN SEUL compte
                Capytale role=teacher ayant clone A a uai_teach == UAI_user dans [T-2j, T+60j].
  B (moyenne) : UAI 1:1 -> exactement 1 compte site ET 1 compte Capytale-teacher sur cet UAI.
  C (faible)  : UAI partage (plusieurs candidats d'un cote) -> ambigu, on liste sans trancher.

Calibration : pionnier (Haubourdin 0590093F) + etablissements 1:1.
Sortie : pseudonymisee (user site = code S####, compte Capytale = md5[:8]). Mapping en SCRATCH.

Mode local nominatif uniquement :
  python3 match_individuals.py --local-only
Calcule seulement SCRATCH/match_nominatif.csv et ne modifie aucune sortie versionnée.
"""
import json, re, os, sys
import pandas as pd
from collections import defaultdict, Counter
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
SNAP=_os.environ.get("MATHADATA_SNAPSHOT", f"{_WS}/mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z")
BASE=f"{_RT}/public/data"
OUT =f"{_ENQ}/site-vers-classe/data"
SCRATCH=_os.environ.get("MATHADATA_LOCAL", f"{_ENQ}/_local")  # ex-scratch session -> dossier local stable (gitignore)
DEMO, PIO = K.DEMO, K.PIO
CAP_RE=re.compile(r'web/b/(\d+)')
LOCAL_ONLY='--local-only' in sys.argv

# ---- site : users + clics capytale nominatifs ----
users={u['id']:u for u in json.load(open(f"{SNAP}/users.json"))}
excl={i for i,u in users.items() if u.get('exclude_from_analytics')}
ann=pd.read_csv(f"{BASE}/annuaire_etablissements.csv",dtype=str,keep_default_na=False)
nom=ann.set_index('uai')['nom'].to_dict(); com=ann.set_index('uai')['commune'].to_dict()
aca=ann.set_index('uai')['academie'].to_dict()
rss=json.load(open(f"{SNAP}/consultation_rss.json"))
clicks=[]
for r in rss:
    u=r.get('user'); f=r.get('file','')
    if u is None or u in excl or 'web/b/' not in (f or ''): continue
    mid=CAP_RE.search(f).group(1)
    uai=(users.get(u,{}) or {}).get('uai') or ''
    clicks.append(dict(site_id=u, mid=mid, t=pd.to_datetime(r['createdAt'],utc=True), uai=uai))
CK=pd.DataFrame(clicks)
print("clics capytale nominatifs:",len(CK),"| avec UAI:",int((CK['uai']!='').sum()),
      "| users distincts:",CK['site_id'].nunique())

# ---- capytale : clones role=teacher (tests/distributions) ----
cap=pd.read_csv(K.capytale_csv(),dtype=str,keep_default_na=False)
cap=cap[cap['teacher']!=DEMO].copy(); cap['role']=cap['role'].str.strip().str.lower()
cap['dt']=pd.to_datetime(pd.to_numeric(cap['created'],errors='coerce'),unit='s',utc=True)
teach=cap[cap['role']=='teacher'].copy()
# le "propriétaire" du clone-test = colonne student si role=teacher (modele des comptes), sinon teacher
teach['owner']=teach.apply(lambda r: r['student'] if r['student'].strip() else r['teacher'],axis=1)
# index : (uai_teach, mid) -> liste (owner, time)
by_um=defaultdict(list)
for r in teach.itertuples():
    key=(r.uai_teach, r.mathadata_id)
    by_um[key].append((r.owner, r.dt))
# comptes capytale-teacher par UAI
cap_acc_by_uai=defaultdict(set)
for r in teach.itertuples():
    if r.uai_teach.strip(): cap_acc_by_uai[r.uai_teach].add(r.owner)

# ---- A : timing match clic->clone ----
matchesA=[]
WIN_PRE=pd.Timedelta(days=2); WIN_POST=pd.Timedelta(days=60)
for r in CK[CK['uai']!=''].itertuples():
    cands=by_um.get((r.uai,r.mid),[])
    inwin=set(o for o,t in cands if (r.t-WIN_PRE)<=t<=(r.t+WIN_POST))
    if len(inwin)==1:
        acc=next(iter(inwin))
        matchesA.append(dict(site_id=r.site_id, cap_acc=acc, uai=r.uai, mid=r.mid,
            click=r.t, conf='A', prio=0))
A=pd.DataFrame(matchesA)
# resoudre : un site_id peut matcher plusieurs activites -> garder paires uniques (site,cap)
if len(A): A=A.sort_values('click').drop_duplicates(['site_id','cap_acc'])

# ---- B : UAI 1:1 ----
site_acc_by_uai=defaultdict(set)
for u,info in users.items():
    if u in excl: continue
    uai=info.get('uai') or ''
    if uai: site_acc_by_uai[uai].add(u)
matchesB=[]
for uai in set(site_acc_by_uai)&set(cap_acc_by_uai):
    ss=site_acc_by_uai[uai]; cc=cap_acc_by_uai[uai]
    if len(ss)==1 and len(cc)==1:
        matchesB.append(dict(site_id=next(iter(ss)), cap_acc=next(iter(cc)), uai=uai, mid='', click=pd.NaT, conf='B', prio=2))
B=pd.DataFrame(matchesB)

# ---- D : déploiement direct (récupère les profs SANS clone-test, ex. « plongée directe ») ----
# PIÈGE corrigé : A et B ne voient que les profs role=teacher ; or 59% des profs n'en créent
# jamais. Ici prof RÉEL = MD5 `teacher` ayant des élèves ; son UAI = uai_teach (ou uai_el) de
# ses lignes élèves. Si un UAI a EXACTEMENT 1 prof réel ET 1 seul compte site ayant cliqué une
# activité Capytale -> on apparie ce compte à ce prof (conf A si l'activité cliquée recoupe une
# activité déployée, sinon B). Conservateur : ne se déclenche pas sur les UAI ambigus.
stud=cap[cap['role']=='student'].copy()
real_teach_by_uai=defaultdict(set); deployed_acts=defaultdict(set)
for r in stud.itertuples():
    u=r.uai_teach.strip() or r.uai_el.strip()
    if u:
        real_teach_by_uai[u].add(r.teacher); deployed_acts[(u,r.teacher)].add(r.mathadata_id)
site_clickers_by_uai=defaultdict(set); clicked_acts_site=defaultdict(set)
for r in CK[CK['uai']!=''].itertuples():
    site_clickers_by_uai[r.uai].add(r.site_id); clicked_acts_site[r.site_id].add(r.mid)
matchesD=[]
for uai,teachers in real_teach_by_uai.items():
    clickers=site_clickers_by_uai.get(uai,set())
    if len(teachers)==1 and len(clickers)==1:
        tid=next(iter(teachers)); sid=next(iter(clickers))
        corrob=bool(clicked_acts_site.get(sid,set()) & deployed_acts.get((uai,tid),set()))
        matchesD.append(dict(site_id=sid, cap_acc=tid, uai=uai, mid='', click=pd.NaT,
            conf=('A' if corrob else 'B'), prio=1))
D=pd.DataFrame(matchesD)

# ---- E : (UAI, activité) unique des DEUX côtés — désambiguïse les UAI multi-comptes ----
# Pour une activité donnée à un UAI : si UN SEUL prof réel l'a déployée ET UN SEUL compte site
# l'a cliquée, avec déploiement après le clic (sens site->classe), on apparie. Capte les
# plongeurs-directs là où D échoue (plusieurs comptes/profs à l'UAI mais une activité discriminante).
dep_t={}   # (uai,mid) -> {teacher: first_deploy_dt}
for r in stud.itertuples():
    u=r.uai_teach.strip() or r.uai_el.strip()
    if not u: continue
    d=dep_t.setdefault((u,r.mathadata_id),{})
    if r.teacher not in d or r.dt<d[r.teacher]: d[r.teacher]=r.dt
clk_t={}   # (uai,mid) -> {site_id: first_click}
for r in CK[CK['uai']!=''].itertuples():
    d=clk_t.setdefault((r.uai,r.mid),{})
    if r.site_id not in d or r.t<d[r.site_id]: d[r.site_id]=r.t
matchesE=[]; WINP=pd.Timedelta(days=2); WINPOST=pd.Timedelta(days=120)
for key,teach_d in dep_t.items():
    clk_d=clk_t.get(key)
    if not clk_d or len(teach_d)!=1 or len(clk_d)!=1: continue
    tid,ddt=next(iter(teach_d.items())); sid,cdt=next(iter(clk_d.items()))
    if (cdt-WINP)<=ddt<=(cdt+WINPOST):
        matchesE.append(dict(site_id=sid, cap_acc=tid, uai=key[0], mid=key[1], click=cdt, conf='A', prio=1))
E=pd.DataFrame(matchesE)
if len(E): E=E.drop_duplicates(['site_id','cap_acc'])

# combine : prio croissant gagne (A timing < D/E déploiement < B uai-1:1) ; 1 site <-> 1 cap
parts=[df for df in (A,D,E,B) if len(df)]
allm=pd.concat(parts,ignore_index=True) if parts else pd.DataFrame(columns=['site_id','cap_acc','uai','conf','prio'])
allm=allm.sort_values('prio').drop_duplicates(['site_id']).drop_duplicates(['cap_acc'])

# ---- pseudonymisation ----
site_codes={sid:f"S{idx:04d}" for idx,sid in enumerate(sorted(set(allm['site_id'])))}
def disp_uai(u): return f"{nom.get(u,'?')} ({com.get(u,'?')})"
rows=[]
for r in allm.itertuples():
    info=users.get(r.site_id,{})
    rows.append(dict(site_code=site_codes[r.site_id], cap_acc=r.cap_acc[:8], conf=r.conf,
        uai=r.uai, commune=com.get(r.uai,''), academie=aca.get(r.uai,''),
        etab=nom.get(r.uai,''), statut=info.get('statut'), ftype=info.get('trainedTypeFormation')))
M=pd.DataFrame(rows).sort_values(['site_code','cap_acc']).reset_index(drop=True)  # ordre déterministe (rebuild idempotent)
if not LOCAL_ONLY:
    M.to_csv(f"{OUT}/match_candidates.csv",index=False)
# mapping nominatif -> SCRATCH uniquement
nominatif=[]
for r in allm.itertuples():
    info=users.get(r.site_id,{})
    nominatif.append(dict(site_code=site_codes[r.site_id], site_id=r.site_id,
        nom=info.get('nom'), prenom=info.get('prenom'), email=info.get('email'),
        cap_acc=r.cap_acc, conf=r.conf, etab=disp_uai(r.uai), statut=info.get('statut')))
pd.DataFrame(nominatif).to_csv(f"{SCRATCH}/match_nominatif.csv",index=False)

# ---- calibration / validation ----
val={}
val['n_matches']=int(len(M)); val['by_conf']={k:int(v) for k,v in M['conf'].value_counts().items()}
# pionnier
val['pioneer_uai_has_site_account']=bool(len([u for u,i in users.items() if (i.get('uai')=='0590093F' and u not in excl)]))
val['pioneer_site_accounts_haubourdin']=int(len([u for u,i in users.items() if (i.get('uai')=='0590093F' and u not in excl)]))
# couverture
val['site_clickers_with_uai']=int((CK['uai']!='').sum() and CK[CK['uai']!='']['site_id'].nunique())
val['matched_share_of_clickers']=round(100*M['site_code'].nunique()/max(1,CK[CK['uai']!='']['site_id'].nunique()),1)
val['n_uai_1to1']=int(len(B))
if not LOCAL_ONLY:
    json.dump(val,open(f"{OUT}/match_validation.json","w"),ensure_ascii=False,indent=1,default=str)
print(json.dumps(val,ensure_ascii=False,indent=1,default=str))
if LOCAL_ONLY:
    print(f"\n✓ Mapping nominatif local écrit : {SCRATCH}/match_nominatif.csv")
    print("  Aucune sortie versionnée n'a été modifiée (--local-only).")
print("\nrepartition confiance:",dict(M['conf'].value_counts()))
print("ex. (pseudonymise):"); print(M.head(12).to_string(index=False))
