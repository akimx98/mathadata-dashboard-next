export const meta = {
  name: 'volet2-formation-integration',
  description: 'Intègre les données de formation (codes/redemptions) : typologie des cohortes par nature, intention vs usage, vérification, ce qui change vs Volet 2 v1',
  phases: [
    { title: 'Analyse', detail: 'typologie cohortes par nature + intention/redemption' },
    { title: 'Verify', detail: 'recalcul indépendant des nouveaux chiffres-clés' },
    { title: 'Synthese', detail: 'ce qui est confirmé / affiné / corrigé vs Volet 2 v1' },
  ],
}

const CTX = `
# CONTEXTE — VOLET 2, intégration des DONNÉES DE FORMATION (mathadata.fr × Capytale)

On a déjà produit le Volet 2 (croisement site nominatif × Capytale anonyme). De NOUVELLES collections de formation viennent d'arriver et permettent de PRÉCISER, voire corriger, des conclusions.

## Nouvelles données (snapshot Payload, PII, gitignore)
/Users/akim/Documents/MathAData_Git/mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z/
- formation-codes.json (45) : 1 ligne = 1 session de formation. Champs : id, label (nom réel, ex "202410_LILLE", "ENS_25", "Web Basque 27 nov 2025", "MEEF INSPÉ Paris"), typeFormation (presentiel|webdecouv|webinaire), formationDate (vraie date ; 2 codes placeholder ont la date bidon 1984-01-01 = "anciens formés avant 15/01/26"), disabled, participants[], participantsCount.
- formation-redemptions.json (239) : validations. user, code (->formation-codes.id), formationDate, intention.modules (modules déclarés), createdAt. Couvre surtout 2026.
- modules.json (7) : id->nom. Mapping module payload -> activité Capytale (mathadata_id) : 1=Stat(3518185), 2=Équation réduite(3515488), 3=Repère/milieu/distance(6659633), 4=Stat fœtus(6944347), 5=1ère produit scalaire(5862412), 6=2nde vecteur directeur(8790616), 7=Intro IA(2548348).
- etablissements.json (13040) : référentiel uai->{nom,ville,academie,type(college|lycee)}. Type TOUS les UAI.

## CORRECTION MAJEURE déjà établie (à respecter)
Le typage formation est désormais REEL via formation-codes (champ users.trainedFormation -> code). 4 catégories :
- nouveau (non formé, 2084)
- presentiel (363) — type réel du code
- webinaire (121) — webdecouv+webinaire genuine
- ancienne_vague (147) — formés AVANT le système de codes (15/01/26), date/type INCONNUS, regroupés dans 2 codes placeholder (date 1984). ATTENTION : dans le Volet 2 v1, ces 147 étaient comptés à tort comme "webdecouv/webinaire" et gonflaient l'usage du webinaire.

## Chiffres déjà recalculés (source de vérité, NE PAS contredire sans recalcul)
- Effet formation (typage réel) : nouveau usage_classe 17.8% / présentiel 23.4% / webinaire 32.4% / ancienne_vague 28.6%. clic Capytale 9.0/26.2/24.8/17.0. ressources moy 2.05/4.04/10.17/4.56.
- Endogénéité présentiel (vraies dates) : ~9 établissements utilisaient Capytale AVANT la formation ; délai formation->1re séance médian 27 j (p25 12, p75 71).
- Intention déclarée (redemption) vs usage : 99 déclarations de modules, 6 réalisées (même activité dans l'étab).
- Cohortes pré-service repérées : ENS_25 (52 profs, 0% usage, ~aucun UAI) et MEEF INSPÉ Paris (13, 0%) = profs STAGIAIRES/pré-service sans établissement -> ne peuvent structurellement pas montrer d'usage classe -> diluent le présentiel.
- Fichiers : enquete_usages_2026/volet2/data/facts_formation.json, cohorts.csv, facts_cross.json (formation_effect mis à jour), et table de travail /private/tmp/claude-502/-Users-akim-Documents-MathAData-Git-mathadata-dashboard-next/49f4f306-c2bb-43a0-af8f-f1b5ce99e908/scratchpad/payload_users_work.csv (colonne fcat).
- Capytale : public/data/capytale_fresh_20260619.csv (role=student=vrais élèves ; uai_el=étab ; created=epoch s). Démo c81e728d exclue, hub Haubourdin cfcd2084 isolé.

## MÉTHODO & SÉCURITÉ
Lire la PII pour calculer, mais AUCUN nom/prénom/email en sortie (pseudonymes, commune, établissement OK). Écrire les scripts dans le scratchpad avec un préfixe unique. Grounder chaque chiffre. Français, sobre, factuel.
`;

const SCHEMA = {type:'object',additionalProperties:false,
  required:['prose_markdown','key_stats','chart_specs','flags'],
  properties:{
    prose_markdown:{type:'string'},
    key_stats:{type:'array',items:{type:'object',additionalProperties:false,required:['label','value','source'],
      properties:{label:{type:'string'},value:{type:'string'},source:{type:'string'}}}},
    case_studies:{type:'array',items:{type:'object',additionalProperties:false,required:['title','narrative'],properties:{title:{type:'string'},narrative:{type:'string'}}}},
    chart_specs:{type:'array',items:{type:'object',additionalProperties:false,required:['title','kind','data'],properties:{title:{type:'string'},kind:{type:'string'},data:{type:'string'}}}},
    flags:{type:'array',items:{type:'string'}}}};

const VERDICT={type:'object',additionalProperties:false,required:['checks','overall'],
  properties:{checks:{type:'array',items:{type:'object',additionalProperties:false,required:['claim','recomputed','agree'],
    properties:{claim:{type:'string'},recomputed:{type:'string'},agree:{type:'boolean'},note:{type:'string'}}}},
    overall:{type:'string'},corrections:{type:'array',items:{type:'string'}}}};

phase('Analyse')
const [cohortNature, intention] = await parallel([
  ()=>agent(`${CTX}

## TA MISSION — Typologie des cohortes par NATURE (au-delà de présentiel/webinaire)
Les 45 codes ont des labels parlants. Classe CHAQUE cohorte (via formation-codes + trainedFormation) en NATURE :
- "pré-service" (ENS, INSPÉ, MEEF, agrégatifs, stagiaires sans établissement) ;
- "établissement-ciblée" (formation dans UN établissement : labels avec nom de lycée/"Formation établissement X") ;
- "académique de masse" (IREM, Labomaths, journée académique, plan de formation, INSPÉ continue, webinaire ouvert) ;
- "distanciel/webinaire" (Web*, webinaire) ;
- "ancienne vague" (placeholder 1984).
Pour chaque nature : nb de cohortes, nb de profs, nb d'UAI déclarés, % établissements à usage élève effectif (cap_used), maturité moyenne (date). QUANTIFIE la dilution du présentiel par le pré-service : recalcule le % d'usage du présentiel EN EXCLUANT les cohortes pré-service. Montre la variance énorme entre cohortes (ex Arpajon 77%, Lille 67%, Calais 56% vs Narbonne 3.8%, Nîmes 0%, ENS 0%). Conclus : qu'est-ce qui prédit qu'une formation aboutisse en classe — le format, la nature, la maturité ? Écris une section publiable (450-700 mots), key_stats sourcés, 1-3 chart_specs avec données chiffrées, et 2-3 études de cas de cohortes (pseudonymisées au grain établissement, noms d'établissement OK).`,
    {label:'cohort-nature',phase:'Analyse',schema:SCHEMA,effort:'high'}),
  ()=>agent(`${CTX}

## TA MISSION — Intention déclarée vs usage réel + parcours de validation
Exploite formation-redemptions (intention.modules) et le mapping module->activité Capytale. Questions :
1. Que déclarent les profs vouloir utiliser (modules) au moment de valider leur formation ? Distribution.
2. Quelle part de ces intentions se réalise réellement (même activité utilisée dans l'établissement du prof, via Capytale uai_el+mathadata_id) ? (déjà : 6/99, creuse pourquoi si faible : trop récent ? activité différente ? pas d'établissement ?).
3. Délai validation->usage. Multi-formation (peu : 1 user à 2 redemptions).
4. La date de redemption (createdAt) vs la formationDate du code : les profs valident-ils le jour de la formation ou après ? Recoupe avec la séquence compte/formation.
5. Le statut "ancienne_vague" (147) : caractérise-les (maturité, usage 28.6%, sont-ils les early-adopters les plus engagés ?).
Section publiable (400-650 mots), key_stats sourcés, chart_specs, flags. Sois honnête sur les petits effectifs (29 redemptions avec intention).`,
    {label:'intention-usage',phase:'Analyse',schema:SCHEMA,effort:'high'}),
])

phase('Verify')
const verdict = await agent(`${CTX}

## VÉRIFICATION ADVERSARIALE
Recalcule INDÉPENDAMMENT depuis les données brutes (snapshot + capytale CSV), sans faire confiance aux facts json, les affirmations centrales de l'intégration formation :
${JSON.stringify([...(cohortNature?.key_stats||[]),...(intention?.key_stats||[])].slice(0,18),null,1)}

Vérifie en priorité : (a) le typage réel des 4 catégories (n=2084/363/121/147) et leur usage_classe (17.8/23.4/32.4/28.6) ; (b) que les 147 ancienne_vague pointent bien vers les 2 codes placeholder 1984 et étaient comptés "webdecouv" dans users.trainedTypeFormation ; (c) la dilution présentiel par pré-service (ENS_25, INSPÉ) ; (d) endogénéité 9 étabs + délai médian 27j ; (e) intention 6/99. Cherche erreurs de fenêtre tracking, double-comptage, endogénéité présentée comme causalité, petits effectifs sur-interprétés. Scripts dans scratchpad préfixe verify_form_.`,
  {label:'verify-formation',phase:'Verify',schema:VERDICT,effort:'high'})

phase('Synthese')
const synth = await agent(`${CTX}

## SYNTHÈSE — Ce qui CHANGE vs Volet 2 v1
Volet 2 v1 (avant données formation) disait notamment : (1) formation ×2,6 le clic ; (2) "webinaire convertit mieux en classe que présentiel (31% vs 24%)" ; (3) endogénéité présentiel "10/27 déjà acquis" ; (4) délai ~2 semaines ; (5) présentiel = amorçage large, webinaire = approfondissement ; (6) cohortes récentes 2026 sous-converties par récence.

À partir des sections ci-dessous et des chiffres recalculés, produis un markdown unique :
1. Tableau "CONCLUSION v1 -> STATUT (confirmée / affinée / corrigée) -> formulation v2" pour chaque conclusion touchée.
2. Les 4-6 ENSEIGNEMENTS NOUVEAUX que seules les données de formation permettent (typologie par nature, pré-service, intention vs usage, cohortes exactes, etc.).
3. 3-4 recommandations actualisées.
4. Les limites/flags consolidés des nouvelles données (couverture redemptions 2026, placeholder 1984, petits effectifs).
Dense, français, prêt à intégrer au rapport.

SECTIONS :
${JSON.stringify({cohortNature:{prose:cohortNature?.prose_markdown,stats:cohortNature?.key_stats},intention:{prose:intention?.prose_markdown,stats:intention?.key_stats},verdict},null,1).slice(0,60000)}`,
  {label:'synthese-changes',phase:'Synthese',effort:'high'})

return {cohortNature, intention, verdict, synthesis:synth}
