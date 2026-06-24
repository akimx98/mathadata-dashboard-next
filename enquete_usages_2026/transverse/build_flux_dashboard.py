#!/usr/bin/env python3
"""Génère dashboard_flux_profs.html À PARTIR de facts_profiles.json (source de vérité unique).
Remplace (a) chaque <span data-f="clé">…</span> par la valeur calculée, (b) l'îlot de données
/*FACTS_START*/ … /*FACTS_END*/ qui alimente les diagrammes Sankey. Le HTML reste autonome
(aucun fetch — CSP-safe). À relancer après build_profiles.py. Puis republier (publish_pages.sh + artefact).
"""
import json, re
from math import comb
import os as _os
_ENQ=_os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
HTML=f"{_ENQ}/transverse/dashboard_flux_profs.html"
fp=json.load(open(f"{_ENQ}/transverse/data/facts_profiles.json"))

t1=fp['traj_canal_devenir']; t2=fp['traj_canal_y1_devenir']
def s1(canal): return {d:int(t1.get(f"{canal}|{d}",0)) for d in ('rev','non','rec')}
via=s1('via_site'); cap=s1('capytale_direct')
via['tot']=sum(via.values()); cap['tot']=sum(cap.values())
def pb(canal): return {lvl:{d:int(t2.get(f"{canal}|{lvl}|{d}",0)) for d in ('rev','non','rec')} for lvl in ('multi','uniq')}
bc=fp['by_canal']; bf=fp['by_formation']; ru=fp['reuse_an1']
def pct(rev,n): return round(100*rev/n) if n else 0
def base(rev,n): return f"{rev}/{n}"
def _rc(o): return pct(o['classe'], o['n'])   # taux « atteint une classe ≥5 » d'une sous-population de l'entonnoir
# ── effet formation : helpers (k/n → taux/base) + Fisher exact bilatéral PUR-PYTHON (pas de scipy dans le pipeline) ──
def kpct(o): return pct(o['k'], o['n'])
def kbase(o): return f"{o['k']}/{o['n']}"
def fisher2x2(a,b,c,d):
    n=a+b+c+d; r1=a+b; r2=c+d; c1=a+c
    def hp(x):
        if x<0 or x>r1 or (c1-x)<0 or (c1-x)>r2: return 0.0
        return comb(r1,x)*comb(r2,c1-x)/comb(n,c1)
    pobs=hp(a); lo=max(0,c1-r2); hi=min(c1,r1)
    return sum(hp(x) for x in range(lo,hi+1) if hp(x)<=pobs*(1+1e-9))
def fpv(o1,o2):  # p-value Fisher entre deux groupes k/n
    p=fisher2x2(o1['k'],o1['n']-o1['k'],o2['k'],o2['n']-o2['k'])
    return ("%.3f"%p) if p>=0.001 else "<0.001"
fe=fp['formation_effect']

vals={
 'pop':fp['n_touched_students'], 'reached':fp['n_reached_classe'], 'ss':fp['sous_seuil_only'], 'elig':fp['eligibles'],
 'popAll':fp['population'], 'test':fp['testeurs_purs'],
 'uniqN':fp['max_level'].get('4',0), 'multiN':fp['max_level'].get('5',0),
 # taux d'atteinte d'une classe ≥5 (population « touché-élèves » = 223), pour le texte du §1
 'rcViaClasse':_rc(fp['funnel']['touched']['rates']['canal']['via_site']),
 'rcCapClasse':_rc(fp['funnel']['touched']['rates']['canal']['capytale_direct']),
 'rcFormeClasse':_rc(fp['funnel']['touched']['rates']['formation']['forme']),
 'rcJamaisClasse':_rc(fp['funnel']['touched']['rates']['formation']['jamais']),
 # §6 — effet de la formation (intensité, retour, médiation) ; tout depuis facts['formation_effect']
 'feMultFpct':kpct(fe['mult_y1']['forme']),  'feMultFbase':kbase(fe['mult_y1']['forme']),
 'feMultJpct':kpct(fe['mult_y1']['jamais']), 'feMultJbase':kbase(fe['mult_y1']['jamais']),
 'feMultP':fpv(fe['mult_y1']['forme'],fe['mult_y1']['jamais']),
 'feMotrPct':kpct(fe['mult_y1']['motrice']), 'feMotrBase':kbase(fe['mult_y1']['motrice']),
 'feMotrP':fpv(fe['mult_y1']['motrice'],fe['mult_y1']['jamais']),
 'feViaFpct':kpct(fe['mult_y1']['via_forme']),  'feViaFbase':kbase(fe['mult_y1']['via_forme']),
 'feViaJpct':kpct(fe['mult_y1']['via_jamais']), 'feViaJbase':kbase(fe['mult_y1']['via_jamais']),
 'feViaP':fpv(fe['mult_y1']['via_forme'],fe['mult_y1']['via_jamais']),
 'feReachFpct':kpct(fe['reach']['forme']),  'feReachFbase':kbase(fe['reach']['forme']),
 'feReachJpct':kpct(fe['reach']['jamais']), 'feReachJbase':kbase(fe['reach']['jamais']),
 'feReachP':fpv(fe['reach']['forme'],fe['reach']['jamais']),
 'feRetFpct':kpct(fe['retour']['forme']),  'feRetFbase':kbase(fe['retour']['forme']),
 'feRetJpct':kpct(fe['retour']['jamais']), 'feRetJbase':kbase(fe['retour']['jamais']),
 'feRetP':fpv(fe['retour']['forme'],fe['retour']['jamais']), 'feRetProxy':fe['retour']['forme_proxy'],
 'feRetFn':fe['retour']['forme']['n'],
 'feMedUP':fpv(fe['med']['unique']['forme'],fe['med']['unique']['jamais']),
 'feMedRFpct':kpct(fe['med']['reuse']['forme']),  'feMedRFbase':kbase(fe['med']['reuse']['forme']),
 'feMedRJpct':kpct(fe['med']['reuse']['jamais']), 'feMedRJbase':kbase(fe['med']['reuse']['jamais']),
 'feMedRP':fpv(fe['med']['reuse']['forme'],fe['med']['reuse']['jamais']),
 'feMedUFpct':kpct(fe['med']['unique']['forme']),  'feMedUFbase':kbase(fe['med']['unique']['forme']),
 'feMedUJpct':kpct(fe['med']['unique']['jamais']), 'feMedUJbase':kbase(fe['med']['unique']['jamais']),
 'feCensFpct':kpct(fe['censored_formes']), 'feCensFbase':kbase(fe['censored_formes']),
 'via.tot':via['tot'], 'cap.tot':cap['tot'], 'via.rec':via['rec'],
 'reuse.pct':pct(ru['reutilise_revenu'],ru['reutilise_n']), 'reuse.base':base(ru['reutilise_revenu'],ru['reutilise_n']),
 'uniq.pct':pct(ru['unique_revenu'],ru['unique_n']),       'uniq.base':base(ru['unique_revenu'],ru['unique_n']),
 'via.pct':pct(bc['via_site']['revenu'],bc['via_site']['n']),         'via.base':base(bc['via_site']['revenu'],bc['via_site']['n']),         'via.eligN':bc['via_site']['n'],
 'cap.pct':pct(bc['capytale_direct']['revenu'],bc['capytale_direct']['n']), 'cap.base':base(bc['capytale_direct']['revenu'],bc['capytale_direct']['n']),
 'forme.pct':pct(bf['forme']['revenu'],bf['forme']['n']),  'forme.base':base(bf['forme']['revenu'],bf['forme']['n']),  'forme.n':bf['forme']['n'],
 'jamais.pct':pct(bf['jamais']['revenu'],bf['jamais']['n']),'jamais.base':base(bf['jamais']['revenu'],bf['jamais']['n']),
 'pctReuse':round(ru['pct_reutilisent_an1']),
}

html=open(HTML).read()
n=0
for key,val in vals.items():
    pat=re.compile(r'(<span data-f="'+re.escape(key)+r'">)[^<]*(</span>)')
    html,c=pat.subn(lambda m: m.group(1)+str(val)+m.group(2), html); n+=c

island=("const F={pop:%d,reached:%d,ss:%d,elig:%d,\n"
        " via:{tot:%d,rev:%d,non:%d,rec:%d},cap:{tot:%d,rev:%d,non:%d,rec:%d},\n"
        " pb:{cap:{multi:{rev:%d,non:%d,rec:%d},uniq:{rev:%d,non:%d,rec:%d}},via:{multi:{rev:%d,non:%d,rec:%d},uniq:{rev:%d,non:%d,rec:%d}}}};"
        ) % (vals['pop'],vals['reached'],vals['ss'],vals['elig'],
             via['tot'],via['rev'],via['non'],via['rec'], cap['tot'],cap['rev'],cap['non'],cap['rec'],
             *(pb('capytale_direct')['multi'][d] for d in('rev','non','rec')),*(pb('capytale_direct')['uniq'][d] for d in('rev','non','rec')),
             *(pb('via_site')['multi'][d] for d in('rev','non','rec')),*(pb('via_site')['uniq'][d] for d in('rev','non','rec')))
html=re.sub(r'/\*FACTS_START\*/.*?/\*FACTS_END\*/',
            '/*FACTS_START*/\n'+island+'\n/*FACTS_END*/', html, flags=re.S)

# îlot FN : entonnoir canal × formation × profondeur (alimente les Sankey « tous les profs »).
# On passe la structure facts['funnel'] telle quelle (touched=223, all=260) — source de vérité unique.
funnel_island = "const FN=" + json.dumps(fp['funnel'], ensure_ascii=False, separators=(',',':')) + ";"
html=re.sub(r'/\*FUNNEL_START\*/.*?/\*FUNNEL_END\*/',
            '/*FUNNEL_START*/\n'+funnel_island+'\n/*FUNNEL_END*/', html, flags=re.S)

# îlot FF : trajectoires formation → intensité an1 → devenir (diag §6).
form_island = "const FF=" + json.dumps(fp['traj_formation_y1_devenir'], ensure_ascii=False, separators=(',',':')) + ";"
html=re.sub(r'/\*FORM_START\*/.*?/\*FORM_END\*/',
            '/*FORM_START*/\n'+form_island+'\n/*FORM_END*/', html, flags=re.S)

open(HTML,'w').write(html)
print(f"dashboard_flux_profs.html régénéré : {n} spans data-f remplis ; F = via {via['tot']} / cap {cap['tot']} ; éligible {vals['elig']} ; FN = touché {fp['funnel']['touched']['n']} / tous {fp['funnel']['all']['n']}")
