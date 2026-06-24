#!/usr/bin/env python3
"""
Reconstruction du volet ENSEIGNANT en tenant compte du modèle de comptes Capytale :
- role = TYPE de compte (enseignant -> role=teacher, élève -> role=student), pas la position dans la chaîne.
- Un prof en formation reste role=teacher : son id va dans la colonne `student` (clone-owner),
  son établissement dans `uai_el`, le formateur dans `teacher`.
- => population enseignante = distributeurs (col teacher) UNION clone-owners des lignes role=teacher (col student).
Produit: data/engaged_teachers.csv + data/facts_teachers.json
"""
import pandas as pd, numpy as np, json
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))  # enquete_usages_2026
_RT=_os.path.dirname(_ENQ)                                           # racine du repo
_WS=_os.path.dirname(_RT)                                            # parent (contient mathadata-website)
import sys as _sys; _sys.path.insert(0,_ENQ); import enquete_common as K  # socle partagé
BASE=f"{_RT}/public/data"
OUT=f"{_ENQ}/usage-capytale/data"
DEMO, PIO = K.DEMO, K.PIO

df=pd.read_csv(K.capytale_csv(),dtype=str,keep_default_na=False)
ann=pd.read_csv(f"{BASE}/annuaire_etablissements.csv",dtype=str,keep_default_na=False)
df=df[df['teacher']!=DEMO].copy(); df['role']=df['role'].str.strip().str.lower()
df['created']=pd.to_numeric(df['created'],errors='coerce')
df['dt']=pd.to_datetime(df['created'],unit='s',utc=True).dt.tz_convert('Europe/Paris')
def sy(d):
    return K.school_year(d)   # impl unique (socle K, coupure 1ᵉʳ août — GLOSSAIRE §1)
df['sy']=df['dt'].apply(sy)
typ=ann.set_index('uai')['type_etablissement'].to_dict()
nom=ann.set_index('uai')['nom'].to_dict(); com=ann.set_index('uai')['commune'].to_dict(); aca=ann.set_index('uai')['academie'].to_dict()
def T(u): return typ.get(u,'inconnu' if u.strip() else 'inconnu')
def modal(s):
    s=s[s.astype(str).str.strip()!='']
    return s.mode().iloc[0] if len(s) else ''

teach=df[df['role']=='teacher']; stud=df[df['role']=='student']
distributors=set(df['teacher'])                 # col teacher (tous rôles)
clone_owners_teacher=set(teach['student'])      # comptes-profs propriétaires d'un clone test
engaged = distributors | clone_owners_teacher
print("distributeurs:",len(distributors),"| clone-owners test:",len(clone_owners_teacher),"| ENGAGÉS:",len(engaged))

# index par compte
rows=[]
g_distrib_stud = stud.groupby('teacher')          # élèves distribués
g_distrib_test = teach.groupby('teacher')         # tests émis (en tant que distributeur/formateur)
own_test = teach[teach['student']==teach['teacher']].groupby('student')   # auto-tests
trainee = teach[teach['student']!=teach['teacher']]                       # clones d'un code d'autrui
g_trainee = trainee.groupby('student')            # en tant que stagiaire (clone-owner)

for acc in engaged:
    pupils = g_distrib_stud.get_group(acc) if acc in g_distrib_stud.groups else None
    n_pupils = pupils['student'].nunique() if pupils is not None else 0
    n_pupil_rows = len(pupils) if pupils is not None else 0
    taught = n_pupils>0
    selftest = acc in own_test.groups
    tr = g_trainee.get_group(acc) if acc in g_trainee.groups else None
    was_trainee = tr is not None
    # formateur ? distribue des clones-test à d'autres (lignes role=teacher, teacher=acc, student!=acc)
    emitted = teach[(teach['teacher']==acc)&(teach['student']!=acc)]
    n_trainees_reached = emitted['student'].nunique()
    is_formateur = n_trainees_reached>=3
    # établissement
    if taught or selftest:
        uai = modal(df[df['teacher']==acc]['uai_teach']) or (modal(pupils['uai_el']) if pupils is not None else '')
    elif was_trainee:
        uai = modal(tr['uai_el'])
    else:
        uai = modal(df[df['teacher']==acc]['uai_teach'])
    # catégorie entonnoir
    if taught:
        cat='a_enseigne'
    elif was_trainee and not selftest and acc not in distributors:
        cat='stagiaire_seul'           # vu uniquement comme clone-owner d'une formation
    else:
        cat='testeur_distributeur'     # a un compte distributeur, testé, mais 0 élève
    rows.append(dict(account=acc, is_pioneer=acc==PIO,
        taught=taught, n_pupils=n_pupils, n_pupil_rows=n_pupil_rows,
        selftest=selftest, was_trainee=was_trainee, is_formateur=is_formateur,
        n_trainees_reached=int(n_trainees_reached), category=cat,
        uai=uai, type_etab=T(uai), academie=aca.get(uai,''), commune=com.get(uai,''), nom_etab=nom.get(uai,''),
        first_dt=str(df[(df['teacher']==acc)|((df['role']=='teacher')&(df['student']==acc))]['dt'].min())))
E=pd.DataFrame(rows).sort_values(list(pd.DataFrame(rows).columns[:2])).reset_index(drop=True)  # ordre déterministe
E.to_csv(f"{OUT}/engaged_teachers.csv",index=False)

F={}
F['engaged_total']=len(E)
F['taught']=int(E['taught'].sum())
F['tested_not_taught']=int((~E['taught']).sum())
F['cat']={k:int(v) for k,v in E['category'].value_counts().items()}
F['trainees_pure']=int((E['category']=='stagiaire_seul').sum())
F['trainees_by_type']={k:int(v) for k,v in E[E['category']=='stagiaire_seul']['type_etab'].value_counts().items()}
# conversion formation -> classe : parmi TOUS les comptes vus comme stagiaire (was_trainee), combien ont enseigné ?
tr_all=E[E['was_trainee']]
F['trainees_seen_total']=int(len(tr_all))
F['trainees_converted_taught']=int(tr_all['taught'].sum())
F['trainee_to_class_rate']=round(100*tr_all['taught'].mean(),1)
# formateurs
fmt=E[E['is_formateur']].sort_values('n_trainees_reached',ascending=False)
F['n_formateurs']=int(len(fmt))
F['formateurs']=[dict(acc=r.account[:8],trainees=int(r.n_trainees_reached),taught=bool(r.taught),
    commune=r.commune,nom=r.nom_etab) for r in fmt.itertuples()]
# collège : profs engagés via collège (uai_el) vs usage classe réel
col_uai=set(ann[ann['type_etablissement']=='college']['uai'])
F['college_teachers_engaged']=int(E[E['type_etab']=='college'].shape[0])
F['college_real_usage_etabs']=int(stud[stud['uai_el'].isin(col_uai)]['uai_el'].nunique())
# pionnier hub
ps=stud[stud['teacher']==PIO]
F['pioneer_pupils']=int(ps['student'].nunique())
F['pioneer_etabs']=int(ps[ps['uai_el'].str.strip()!='']['uai_el'].nunique())
F['pioneer_haubourdin']=int(ps[ps['uai_el']=='0590093F']['student'].nunique())
# tests portés par formateurs/animateurs par activité
ANIM=set(fmt['account'])
ACT={'3518185':'Stat classif','2548348':'Intro IA','3515488':'Équation réduite'}
F['animator_share_tests']={}
for mid,lab in ACT.items():
    a=teach[teach['mathadata_id']==mid]
    F['animator_share_tests'][lab]=dict(tests=int(len(a)),anim=int(a['teacher'].isin(ANIM).sum()),
        pct=round(100*a['teacher'].isin(ANIM).mean(),0))
# pupils unchanged
F['real_pupils']=int(stud['student'].nunique())
F['pupils_are_teachers']=int(len(set(stud['student'])&engaged))

json.dump(F,open(f"{OUT}/facts_teachers.json","w"),ensure_ascii=False,indent=1,default=str)
print(json.dumps(F,ensure_ascii=False,indent=1,default=str))
