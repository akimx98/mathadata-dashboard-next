#!/usr/bin/env python3
"""
VOLET 2 — analyse des formations au grain CODE (formation-codes/redemptions).
Produit data/facts_formation.json + data/cohorts.csv.
Apports vs v1 :
- cohortes EXACTES (label, type reel, vraie date, effectif) au lieu d'une inference au mois ;
- separation des 147 'anciens formes' (placeholder 1984) du vrai webinaire ;
- endogeneite mesuree avec la VRAIE date de formation (usage Capytale anterieur vs posterieur) ;
- intention declaree (redemption.intention.modules) vs activite Capytale reellement utilisee.
"""
import json, csv, os, math
import pandas as pd, numpy as np
from datetime import datetime
def _san(o):
    """NaN/inf -> None pour produire du JSON strict."""
    if isinstance(o,float) and (math.isnan(o) or math.isinf(o)): return None
    if isinstance(o,dict): return {k:_san(v) for k,v in o.items()}
    if isinstance(o,(list,tuple)): return [_san(v) for v in o]
    return o
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
SNAP=_os.environ.get("MATHADATA_SNAPSHOT", f"{_WS}/mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z")
BASE=f"{_RT}/public/data"
OUT =f"{_ENQ}/site-vers-classe/data"
DEMO='c81e728d9d4c2f636f067f89cc14862c'
def dt(s): return pd.to_datetime(s,utc=True,errors='coerce')

users={u['id']:u for u in json.load(open(f"{SNAP}/users.json"))}
excl={i for i,u in users.items() if u.get('exclude_from_analytics')}
fcodes={c['id']:c for c in json.load(open(f"{SNAP}/formation-codes.json"))}
fr=json.load(open(f"{SNAP}/formation-redemptions.json"))
mods={m['id']:m['name'] for m in json.load(open(f"{SNAP}/modules.json"))}
PLACEHOLDER={cid for cid,c in fcodes.items() if str(c.get('formationDate','')).startswith('1984')}
# module payload -> mathadata_id Capytale
MOD2MID={1:'3518185',2:'3515488',3:'6659633',4:'6944347',5:'5862412',6:'8790616',7:'2548348'}

# ---- Capytale : usage eleve par UAI + 1re date ----
cap=[r for r in csv.DictReader(open(f"{BASE}/capytale_fresh_20260619.csv")) if r['teacher']!=DEMO]
for r in cap: r['_dt']=pd.to_datetime(int(r['created']),unit='s',utc=True) if r['created'] else pd.NaT
stud=[r for r in cap if r['role'].strip().lower()=='student' and r['uai_el'].strip()]
uai_first_use={}
uai_pupils={}
uai_acts={}
for r in stud:
    u=r['uai_el']
    uai_first_use[u]=min(uai_first_use.get(u,r['_dt']),r['_dt'])
    uai_pupils.setdefault(u,set()).add(r['student'])
    uai_acts.setdefault(u,set()).add(r['mathadata_id'])
cap_used=set(uai_first_use)

# ---- cohortes par code (via trainedFormation) ----
formed=[u for i,u in users.items() if i not in excl and u['statut'] in ('forme','mentor')]
by_code={}
for u in formed:
    by_code.setdefault(u.get('trainedFormation'),[]).append(u)

def fcat(code_id):
    if code_id is None or code_id in PLACEHOLDER: return 'ancienne_vague'
    t=fcodes.get(code_id,{}).get('typeFormation')
    return 'presentiel' if t=='presentiel' else ('webinaire' if t in ('webdecouv','webinaire') else 'ancienne_vague')

cohorts=[]
for cid,members in by_code.items():
    c=fcodes.get(cid,{})
    fd=dt(c.get('formationDate')) if (cid and cid not in PLACEHOLDER) else pd.NaT
    cat=fcat(cid)
    uais=[m['uai'] for m in members if m.get('uai')]
    n_uai=len(uais)
    at_used=sum(1 for u in uais if u in cap_used)
    # usage posterieur a la formation (etab dont 1re seance >= date formation - 7j)
    after=0; before=0
    if pd.notna(fd):
        for u in set(uais):
            if u in uai_first_use:
                if uai_first_use[u] >= fd - pd.Timedelta(days=7): after+=1
                else: before+=1
    cohorts.append(dict(code=cid, label=str(c.get('label',''))[:60], type=cat,
        date=str(fd)[:10] if pd.notna(fd) else '', n_profs=len(members), n_uai=n_uai,
        at_used=at_used, pct_used=round(100*at_used/n_uai,1) if n_uai else None,
        usage_after=after, usage_before_endogene=before,
        clicked_cap=sum(1 for m in members if False)))  # placeholder, clic non requis ici
C=pd.DataFrame(cohorts).sort_values('n_profs',ascending=False)
C.to_csv(f"{OUT}/cohorts.csv",index=False)

F={}
F['n_codes']=len(fcodes)
F['n_codes_active']=sum(1 for c in fcodes.values() if not c.get('disabled'))
F['types_codes']={}
from collections import Counter
F['types_codes']=dict(Counter(c.get('typeFormation') for c in fcodes.values()))
F['fcat_profs']=dict(Counter(fcat(u.get('trainedFormation')) for u in formed))
# endogeneite presentiel (au grain etab, vraie date)
pres=C[C['type']=='presentiel']
F['presentiel_cohorts']=int(len(pres))
F['presentiel_uai']=int(pres['n_uai'].sum())
F['presentiel_at_used']=int(pres['at_used'].sum())
F['presentiel_usage_after']=int(pres['usage_after'].sum())
F['presentiel_usage_before_endogene']=int(pres['usage_before_endogene'].sum())
F['presentiel_pct_endogene']=round(100*pres['usage_before_endogene'].sum()/max(1,pres['at_used'].sum()),1)
# delai formation -> 1re seance (etabs avec usage posterieur)
delays=[]
for cid,members in by_code.items():
    c=fcodes.get(cid,{}); fd=dt(c.get('formationDate'))
    if pd.isna(fd) or fcat(cid)!='presentiel': continue
    for u in set(m['uai'] for m in members if m.get('uai')):
        if u in uai_first_use and uai_first_use[u]>=fd-pd.Timedelta(days=7):
            delays.append((uai_first_use[u]-fd).days)
F['presentiel_delay_days']=dict(n=len(delays),
    median=int(np.median(delays)) if delays else None,
    p25=int(np.percentile(delays,25)) if delays else None,
    p75=int(np.percentile(delays,75)) if delays else None)
# top cohortes (pour le rapport)
F['top_cohorts']=[dict(label=r.label,type=r.type,date=r.date,n_profs=int(r.n_profs),
    n_uai=int(r.n_uai),pct_used=r.pct_used) for r in C.head(16).itertuples()]

# ---- intention declaree (redemption) vs usage reel ----
red=[r for r in fr if r.get('user') in users and r['user'] not in excl]
F['redemptions']=len(red)
F['redemptions_distinct_users']=len(set(r['user'] for r in red))
F['redemptions_with_intention']=sum(1 for r in red if (r.get('intention') or {}).get('modules'))
intent_decl=Counter(); match_intent=0; tot_intent=0
for r in red:
    mlist=(r.get('intention') or {}).get('modules') or []
    u=users.get(r['user'],{})
    uai=u.get('uai')
    for m in mlist:
        intent_decl[mods.get(m,str(m))]+=1
        tot_intent+=1
        mid=MOD2MID.get(m)
        if uai and mid and uai in uai_acts and mid in uai_acts[uai]:
            match_intent+=1
F['intention_declared']={k:int(v) for k,v in intent_decl.most_common()}
F['intention_vs_usage']=dict(total_declarations=tot_intent, realized_same_activity_in_etab=match_intent,
    note="part des modules declares en intention (redemption) effectivement utilises (meme activite) dans l'etab du prof, grain etab")
# ancienne vague
av=[u for u in formed if fcat(u.get('trainedFormation'))=='ancienne_vague']
av_uai=[u['uai'] for u in av if u.get('uai')]
F['ancienne_vague']=dict(n=len(av), n_uai=len(av_uai),
    at_used=sum(1 for u in av_uai if u in cap_used),
    pct_used=round(100*sum(1 for u in av_uai if u in cap_used)/max(1,len(av_uai)),1))

# ---- typologie par NATURE au grain ETABLISSEMENT distinct ----
ETAB_KW=['Formation établissement Gif','Arpajon','Calais lycée Pro','202410_LILLE','20250422 AMIENS','MONTPELLIER_25']
# Pré-service STRICT = étudiants sans classe (master MEEF). 'MEEF' suffit (matche
# 'MEEF INSPÉ Paris') et n'attrape PAS 'INSPE Formation 26/11' (profs en exercice).
# ⚠️ ENS_25 (52 profs) N'EST PAS du pré-service : formation francilienne OUVERTE,
# non ciblée, suivie par des profs EN EXERCICE, peu efficace et non reconduite ->
# elle retombe dans 'academique-de-masse' ; son 0 % d'usage est un vrai échec de
# formation de masse, pas un artefact structurel. (Réglage validé équipe, 21/06/2026.)
PRESERV_KW=['MEEF']
def nature(cid):
    L=str(fcodes.get(cid,{}).get('label',''))
    if cid in PLACEHOLDER: return 'ancienne_vague'
    if any(k in L for k in PRESERV_KW): return 'pre-service'
    if any(k in L for k in ETAB_KW): return 'etablissement-ciblee'
    t=fcodes.get(cid,{}).get('typeFormation')
    if t in ('webdecouv','webinaire'): return 'distanciel-webinaire'
    return 'academique-de-masse'
from collections import defaultdict
nat_estab=defaultdict(set); nat_used=defaultdict(set); nat_profs=defaultdict(int); nat_coh=defaultdict(set)
for u in formed:
    n=nature(u.get('trainedFormation')); nat_profs[n]+=1; nat_coh[n].add(u.get('trainedFormation'))
    if u.get('uai'):
        nat_estab[n].add(u['uai'])
        if u['uai'] in cap_used: nat_used[n].add(u['uai'])
F['nature_typology']={n:dict(cohorts=len(nat_coh[n]),profs=nat_profs[n],etab_distincts=len(nat_estab[n]),
    etab_avec_classe=len(nat_used[n]),pct_etab=round(100*len(nat_used[n])/len(nat_estab[n]),1) if nat_estab[n] else None)
    for n in ['etablissement-ciblee','distanciel-webinaire','ancienne_vague','academique-de-masse','pre-service']}
F['nature_note']="Grain ETABLISSEMENT distinct (un lycee a plusieurs profs formes compte 1 fois) ; 'a une classe' = au moins 1 usage eleve Capytale sur l'historique complet (>=1 eleve = a deploye ; distinct du seuil KPI 'vraie classe >=10'). Au grain prof, etablissement-ciblee ~67% (surestime). Base petite (22 etabs ciblee) -> ordre de grandeur, mais classification CONFIRMEE par l'equipe (Gif, Lille 2024, Calais lycee pro, Amiens = vraies ciblees). Pre-service STRICT = master MEEF (sans classe, ~13) ; ENS_25 (52 profs, profs en exercice, formation ouverte non ciblee) est classee academique-de-masse -> son 0% est un echec reel, pas un artefact."

json.dump(_san(F),open(f"{OUT}/facts_formation.json","w"),ensure_ascii=False,indent=1,default=str,allow_nan=False)
print(json.dumps(F,ensure_ascii=False,indent=1,default=str))
