export const meta = {
  name: 'enquete-mathadata-usages',
  description: 'Vérifie les KPI MathAData et mine des analyses approfondies par problématique',
  phases: [
    { title: 'Vérification', detail: '3 agents recalculent les KPI indépendamment du CSV brut' },
    { title: 'Approfondissement', detail: '5 fact-miners creusent chaque problématique' },
  ],
}

const DEFS = `
DÉFINITIONS CANONIQUES (à respecter STRICTEMENT) — voir aussi /Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/DEFINITIONS.md
- CSV BRUT: /Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/capytale_fresh_20260619.csv (cols: assignment_id,created,changed,assignment_title,student,role,uai_el,activity_id,teacher,uai_teach,mathadata_id,mathadata_title ; created/changed = epoch secondes UTC -> convertir Europe/Paris).
- ANNUAIRE: /Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/annuaire_etablissements.csv (uai,nom,type_etablissement[college|lycee],commune,academie,departement,secteur[Public|Privé],ips,latitude,longitude).
- TABLES CANONIQUES déjà construites: /Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/volet1/data/{usages_enriched.csv, teachers.csv, establishments.csv, sessions.csv, facts.json}.
- Compte démo À EXCLURE: teacher==c81e728d9d4c2f636f067f89cc14862c (195 lignes rôle-vide). Compte pionnier À SIGNALER: teacher==cfcd208495d565ef66e7dff9f98764da (=id "0", 404 élèves, Haubourdin/Lille, actif 2023-26).
- Année scolaire sy = annee si mois>=8 sinon annee-1 (ex "2024-2025").
- Prof = id 'teacher'. Tests = lignes role=teacher du prof ; Élèves = lignes role=student du prof.
- Comportement: testé_seulement / testé_puis_enseigné (1er test<=1er élève) / enseigné_sans_test / enseigné_puis_testé (1er test>1er élève). Regroupement: A=testé jamais enseigné, B=testé puis enseigné, C=enseigné sans test préalable (=enseigné_sans_test+enseigné_puis_testé).
- Séance = run de clones ÉLÈVES (même teacher+mathadata_id+uai_el) à <3h d'écart consécutif. « Classe » = séance >=10 élèves.
- IPS baseline national lycées: moyenne 107.0 / médiane 105.7.
- pandas est installé (python3). Écris tes scripts temporaires dans /tmp. N'écris RIEN dans le dossier public/data ni enquete_usages_2026.
`

const VERIF_SCHEMA = {
  type: 'object', additionalProperties: true,
  properties: {
    kpis: { type: 'array', items: { type: 'object', additionalProperties: true,
      properties: { name: {type:'string'}, value: {}, method_note: {type:'string'} },
      required: ['name','value'] } },
    anomalies: { type: 'array', items: { type: 'string' } },
  }, required: ['kpis']
}

const MINE_SCHEMA = {
  type: 'object', additionalProperties: true,
  properties: {
    topic: { type: 'string' },
    key_stats: { type: 'object', additionalProperties: true },
    insights: { type: 'array', items: { type: 'string' } },
    examples: { type: 'array', items: { type: 'object', additionalProperties: true } },
    chart_data: { type: 'object', additionalProperties: true },
    caveats: { type: 'array', items: { type: 'string' } },
  }, required: ['topic','key_stats','insights']
}

phase('Vérification')
const verifBundles = [
 { label:'verif:overview-growth', q:`Recalcule INDÉPENDAMMENT depuis le CSV BRUT (n'ouvre PAS facts.json) ces KPI et renvoie value exacte: (1) n lignes total, n student, n teacher, n rôle-vide; (2) n profs uniques réels (hors compte démo), n élèves uniques (student distinct, role=student, hors démo), n activités (mathadata_id distinct); (3) usages par année scolaire sy x role (hors démo); (4) profs ayant ENSEIGNÉ (=>=1 ligne role=student) par sy; (5) rétention: nb profs ayant enseigné en 2024-2025 ET 2025-2026, taux; nb profs enseignant 2025-2026 NOUVEAUX (jamais enseigné avant 2024-2025 inclus). Signale toute anomalie.` },
 { label:'verif:behavior-funnel', q:`Recalcule INDÉPENDAMMENT depuis le CSV BRUT (hors compte démo): (1) répartition des profs par comportement (testé_seulement / testé_puis_enseigné / enseigné_sans_test / enseigné_puis_testé) — donne les 4 effectifs; (2) parmi profs ayant enseigné, combien ont testé AVANT leur 1ère classe; (3) funnel test->enseignement par activité (mathadata_id): n_profs_tested, n_profs_taught, n_tested_then_taught, taux conversion=tested∩taught/tested, pour les 5 plus grosses activités; (4) reconstruis les séances (règle <3h, même teacher+mathadata_id+uai_el): n séances totales, n séances=1 élève, n classes>=10, taille médiane des classes>=10. Signale toute anomalie.` },
 { label:'verif:etab-power-temporal', q:`Recalcule INDÉPENDAMMENT depuis CSV BRUT + ANNUAIRE (hors compte démo). Établissement prof = uai_teach modal sinon uai_el modal des élèves. (1) profs par type_etablissement (lycee/college/inconnu) et par secteur; (2) IPS des lycées utilisateurs (moyenne, médiane) vs national lycées (recalcule le national depuis l'annuaire type=lycee); (3) n académies, n départements touchés; top 5 académies par élèves uniques; (4) power users: part des élèves uniques captée par le top10 profs, et coefficient de Gini des élèves uniques/prof; (5) distribution nb d'années scolaires où chaque prof a enseigné (1/2/3), et distribution nb de séances/prof (1, 2-3, 4-9, 10+). Signale toute anomalie.` },
]
const verifs = await parallel(verifBundles.map(b => () =>
  agent(`${DEFS}\nTu es un agent de VÉRIFICATION adversariale. Recalcule tout toi-même en Python, ne fais confiance à aucun chiffre pré-calculé. ${b.q}\nRenvoie un objet {kpis:[{name,value,method_note}], anomalies:[...]}.`,
    { label:b.label, phase:'Vérification', schema:VERIF_SCHEMA, effort:'medium' })))

phase('Approfondissement')
const mineTasks = [
 { label:'mine:pionnier-geo', q:`THÈME: Effet pionnier & trajectoire géographique. En t'appuyant sur les tables canoniques (usages_enriched.csv, teachers.csv, establishments.csv) et l'annuaire:
 - Trajectoire géographique par année scolaire: pour 2023-2024, 2024-2025, 2025-2026, donne le top académies et top départements (élèves uniques + nb profs enseignant). Montre la part du Nord/Hauts-de-France et de l'académie de Lille dans le temps.
 - Quantifie l'EFFET PIONNIER: poids du compte cfcd2084 (id "0", Haubourdin/Lille) dans le total élèves, dans le Nord, et dans 2023-24/2024-25. Recalcule les parts géographiques SANS ce compte pour voir ce qui tient à lui.
 - Émergence 2025-26: quelles académies/départements NOUVEAUX apparaissent? lesquels portent le volume? 
 - Donne des exemples nommés (nom_etab + commune) d'établissements moteurs par année.
 Renvoie key_stats chiffré, insights, examples (établissements moteurs), chart_data (séries part_Nord par année, top académies 2025-26).` },
 { label:'mine:croissance-2526', q:`THÈME: Qu'est-ce qui PORTE la croissance 2025-2026 vs 2024-2025? Décompose rigoureusement (tables canoniques):
 - Volume élèves: 2024-25 vs 2025-26 (attention 2025-26 incomplète, extraction 19/06). Part de la croissance due aux NOUVEAUX profs (jamais enseigné avant) vs profs récurrents.
 - Mix ACTIVITÉS: quelles activités/niveaux(2nde/1ere/...)/thèmes(Statistiques/Géométrie/IA/Challenge) croissent le plus en volume élèves entre les deux années? donne les deltas.
 - Intensité: élèves/prof, séances/prof, classes/prof par année. Le modèle est-il plus extensif (plus de profs) ou intensif (plus par prof)?
 - Élargissement: nb profs, établissements, académies par année.
 - Profils des nouveaux profs 2025-26 (type, secteur, IPS moyen, académies).
 Renvoie key_stats, insights (qui PORTE la croissance, en 3-5 phrases factuelles), chart_data (élèves par activité x année, nouveaux vs récurrents).` },
 { label:'mine:dynamiques-locales', q:`THÈME: Dynamiques locales dans les établissements. Avec teachers.csv + establishments.csv + usages_enriched.csv:
 - Répartition établissements par nb de profs utilisateurs (1, 2, 3+), part du solo.
 - Pour les établissements MULTI-PROFS (>=2): distingue (a) lancement conjoint (profs démarrent la même année scolaire) vs (b) diffusion échelonnée (un pionnier une année, des collègues l'année suivante). Compte chaque cas.
 - Identifie 5-7 ÉTUDES DE CAS nommées (nom_etab, commune, académie): établissements à forte dynamique collégiale, avec la timeline (qui a commencé quand, combien d'élèves, quelles activités). Inclure au moins un cas de diffusion échelonnée et un cas solo intense.
 - Y a-t-il des collègues qui TESTENT mais n'enseignent pas dans un établissement où un autre prof enseigne (collègue non convaincu)? compte ces cas.
 Renvoie key_stats, insights, examples (études de cas détaillées), chart_data.` },
 { label:'mine:non-convertis', q:`THÈME: Profil des testeurs NON convertis + timing de conversion. Tables canoniques:
 - Sépare les 37 'testé_seulement' en (a) VRAIS non-adoptants = ont testé en 2024-2025 ou avant et n'ont jamais enseigné à ce jour; (b) testeurs RÉCENTS = testé seulement en 2025-2026 (peuvent encore convertir). Donne les effectifs.
 - Profile les VRAIS non-adoptants: type établissement, secteur, académie, activité testée, mois/saison du test, nb de tests. Y a-t-il un sur-représentation collège? (compare à la base profs).
 - Pour les CONVERTIS (testé_puis_enseigné, n=52): distribution du délai test->1ère classe (même jour, <=7j, <=30j, >30j); médiane. Le test rapproché prédit-il l'adoption?
 - Quelle activité a le plus mauvais taux de conversion test->enseignement, et pourquoi (niveau, complexité)?
 Renvoie key_stats, insights, examples, chart_data (histogramme délai conversion).` },
 { label:'mine:pedagogie-fine', q:`THÈME: Patterns pédagogiques fins. Avec sessions.csv + usages_enriched.csv:
 - Taille de classe: distribution des séances>=10 élèves; taille médiane/moyenne par activité et par niveau. Preuve du demi-groupe (12-18)?
 - 'Petit groupe puis classe entière': pour chaque prof, séquence temporelle des séances; compte les profs ayant fait une petite séance (<=6) AVANT une classe (>=10) plus tard. Donne 2-3 exemples.
 - Réutilisation / 2e séance: détecte les cas où des élèves reprennent leur travail >1h après (changed-created grand) OU 2 vagues de clones du même (teacher,mathadata_id,uai_el) séparées de plusieurs jours. Compte; estime le travail à domicile (clones le week-end ou créneaux soir).
 - Multi-activités: combien de profs enseignent >=2 activités différentes? séquences typiques (ex: Statistiques puis Géométrie)?
 Renvoie key_stats, insights, examples, chart_data (distribution taille de classe par bins).` },
]
const mines = await parallel(mineTasks.map(t => () =>
  agent(`${DEFS}\nTu es un analyste de données. Lis facts.json et les tables canoniques pour ne pas tout recalculer, puis APPROFONDIS le thème ci-dessous avec du Python rigoureux. Tes chiffres doivent être cohérents avec les définitions. Renvoie UNIQUEMENT l'objet structuré.\n${t.q}`,
    { label:t.label, phase:'Approfondissement', schema:MINE_SCHEMA, effort:'high' })))

return {
  verification: verifBundles.map((b,i)=>({bundle:b.label, result:verifs[i]})),
  deepdives: mineTasks.map((t,i)=>({topic:t.label, result:mines[i]})),
}
