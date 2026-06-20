export const meta = {
  name: 'volet2-cross-analysis',
  description: 'Croisement mathadata.fr (nominatif) x Capytale (anonyme) : deep-dive par etape du pipeline, verification adversariale, synthese',
  phases: [
    { title: 'Investigate', detail: 'un agent par theme du pipeline : cuts fins + redaction' },
    { title: 'Verify', detail: 'recalcul independant des chiffres-cles de chaque theme' },
    { title: 'Synthesize', detail: 'assemblage, resume executif, insights transverses' },
  ],
}

const SHARED = `
# CONTEXTE — Enquete VOLET 2 : du site a la classe (mathadata.fr x Capytale)

Tu es analyste de donnees pour MathAData (TP numerique de maths, lycee/college, surtout 2nde, souvent demi-groupes 12-18 eleves).
Objectif global : reconstituer le PIPELINE COMPLET d'un prof :
  entend parler de MathAData -> (peut-etre) cree un compte sur mathadata.fr OU va direct sur Capytale
  -> (peut-etre) suit une formation et devient "forme" -> teste le TP sur Capytale -> le donne a ses eleves
  -> re-utilise (autre classe, autre activite, annee suivante).
Questions transverses : patterns temporels, geographiques, typologies de profs et d'usage, et surtout EFFET DES FORMATIONS sur l'usage (distinguer par type : presentiel vs webinaire).

## DEUX SOURCES
1) Capytale (USAGE, ANONYME). CSV : /Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/capytale_fresh_20260619.csv
   Colonnes : assignment_id,created,changed,assignment_title,student,role,uai_el,activity_id,teacher,uai_teach,mathadata_id,mathadata_title
   - created = epoch SECONDES UTC. role = TYPE de compte (teacher/student), PAS la position. Un prof EN FORMATION reste role=teacher : son id va dans la colonne 'student' (clone-owner), son etab dans uai_el, le formateur dans 'teacher'.
   - role=student = VRAIS eleves (~5854, non contamines). teacher 'c81e728d...' = DEMO a EXCLURE. 'cfcd2084...' (MD5 "0") = HUB FONDATEUR (Haubourdin), pas un prof local.
   - mathadata_id = activite-maitre (ce qui est clone). Labels : 3518185=Stat classification (vitrine, seule accessible sans compte), 2548348=Intro a l'IA (ANCIENNE activite, PAS sur le site, trouvable seulement via Capytale), 3515488=Equation reduite (tres utilisee en FORMATION de profs), 6944347=Stat sante foetus, 6659633=Geometrie reperee, 5862412=Droite produit scalaire, 8790616=Eq cartesienne/vecteur, 5909323=Challenge IA, 3534169=Challenge BTS/NSI.
2) mathadata.fr (payload, NOMINATIF, PII). Snapshot : /Users/akim/Documents/MathAData_Git/mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z/
   Fichiers : users.json (2724), sessions.json (25908), events.json (24683), consultation_rss.json (13197). README.md = dictionnaire complet.
   - users : statut (nouveau/forme/mentor), trainedTypeFormation ('presentiel'=en etab / 'webdecouv'=webinaire), trainedDateFormation (date de la formation ; SENTINELLE BIDON '1984-01-01T12:00:00Z' = manquante, 149 cas webdecouv), createdAt, uai, academie, lycee_ville, hors_lycee, newsletter, newsletter_only, last_login, exclude_from_analytics (9 comptes a EXCLURE), roles (formateur/ambassadeur/...), usageIntention/formationIntention.
   - consultation_rss : clic ressource. file 'capytale2.ac-paris.fr/web/b/<id>' => <id> == mathadata_id Capytale. C'EST LE PONT entre les deux mondes (user nominatif -> activite Capytale, date).
   - events : module_view, resource_download (metadata.resourceType in {pdf,capytale,latex,odp,web}, resourceUrl), video_view/video_end (videoTitle ; certaines = videos de FORMATION).
   - GARDE-FOU : tracking clics/events seulement depuis ~27 nov 2025. Les comptes anterieurs ont un usage SOUS-capture cote site. La conversion au grain ETABLISSEMENT (un UAI a-t-il un usage ELEVE Capytale) utilise l'historique COMPLET Capytale (2023-2026) et n'est PAS biaisee.

## LIMITE STRUCTURELLE
Aucun identifiant commun : comptes Capytale = ENT anonymes. L'appariement individuel est INFERE (UAI+activite+timing) et partiel. Privilegier le grain ETABLISSEMENT (UAI) et COHORTE de formation, robustes. L'individuel est un bonus a confiance signalee.

## SOURCE DE VERITE (chiffres deja calcules — NE PAS contredire sans preuve ; si ton recalcul diverge, SIGNALE-le)
- Croisement : /Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/volet2/data/facts_cross.json
- Tables : volet2/data/capytale_by_uai_teach.csv, capytale_by_uai_el.csv, presentiel_etabs.csv, match_candidates.csv (pseudonymise), match_validation.json
- Table de travail users (PII-free, id payload + activite, SANS nom/email) : /private/tmp/claude-502/-Users-akim-Documents-MathAData-Git-mathadata-dashboard-next/49f4f306-c2bb-43a0-af8f-f1b5ce99e908/scratchpad/payload_users_work.csv
- Volet 1 (Capytale seul, deja produit) : enquete_usages_2026/data/facts.json (overview/growth/...) et facts_teachers.json (401 engages -> 224 enseignants -> 177 testeurs, +105% eleves, 5854 eleves, IPS, geo).

## METHODO & SECURITE (IMPERATIF)
- Tu PEUX lire le snapshot PII pour calculer, mais tes SORTIES ne doivent contenir AUCUN nom/prenom/email. Designer les profs par code (S####), commune/academie, etablissement (nom d'etab OK car public), ou compte Capytale md5[:8]. Pas de re-identification.
- Ecris tes scripts Python dans le scratchpad avec un prefixe unique a ton theme (ex: th3_*.py) pour eviter les collisions.
- Grounde CHAQUE chiffre par un calcul. Distingue toujours les signaux biaises par la fenetre de tracking des signaux historiques complets.
- Quand pertinent, distingue presentiel vs webinaire.
- Ecris en FRANCAIS, prose argumentee, dense et juste, ton sobre et factuel (pas de hype). Pas d'emoji.
`;

const SECTION_SCHEMA = {
  type:'object', additionalProperties:false,
  required:['section_title','prose_markdown','key_stats','case_studies','data_quality_flags','chart_specs'],
  properties:{
    section_title:{type:'string'},
    prose_markdown:{type:'string', description:'Section redigee en francais, markdown, 450-800 mots, argumentee, chiffres integres.'},
    key_stats:{type:'array', items:{type:'object', additionalProperties:false, required:['label','value','source'],
      properties:{label:{type:'string'}, value:{type:'string'}, note:{type:'string'}, source:{type:'string', description:'comment c est calcule / d ou ca vient'}}}},
    case_studies:{type:'array', items:{type:'object', additionalProperties:false, required:['title','narrative'],
      properties:{title:{type:'string'}, narrative:{type:'string', description:'vignette pseudonymisee (commune/etab/activite/dates), pas de nom de personne'}}}},
    data_quality_flags:{type:'array', items:{type:'string'}},
    chart_specs:{type:'array', items:{type:'object', additionalProperties:false, required:['title','kind','data'],
      properties:{title:{type:'string'}, kind:{type:'string', description:'bars|hbars|line|funnel|grouped|stacked'}, data:{type:'string', description:'series chiffrees pretes a tracer (JSON inline)'}}}},
  }
}

const VERDICT_SCHEMA = {
  type:'object', additionalProperties:false,
  required:['theme','checks','overall'],
  properties:{
    theme:{type:'string'},
    checks:{type:'array', items:{type:'object', additionalProperties:false, required:['claim','recomputed','agree'],
      properties:{claim:{type:'string'}, recomputed:{type:'string'}, agree:{type:'boolean'}, note:{type:'string'}}}},
    overall:{type:'string', description:'solide | corrections_mineures | probleme_majeur'},
    corrections:{type:'array', items:{type:'string'}},
  }
}

const THEMES = [
  { key:'pipeline_funnel', title:'Le pipeline complet, de la notoriete a la classe',
    brief:`Construis le funnel de bout en bout en combinant site + Capytale : comptes crees (2724, dont 1003 newsletter_only) -> comptes complets (1721) -> formes (638) -> ont clique vers Capytale (337) -> ont teste sur Capytale -> ont enseigne a des eleves (volet1: 224 / 5854 eleves) -> re-usage. Quantifie chaque marche et chaque fuite. Mesure le funnel SITE propre sur la cohorte trackable (apres 27 nov 2025). Calcule les delais compte->1ere action (module/ressource/capytale). Distingue clairement ce qui est mesure cote site (intention) vs cote Capytale (usage reel). Cadre le tout avec le garde-fou tracking.` },
  { key:'effet_formation', title:'Effet des formations sur l usage (presentiel vs webinaire)',
    brief:`COEUR du volet. Compare rigoureusement non-formes / formes-presentiel / formes-webdecouv sur : %clic Capytale, %actif, %dont l etablissement a un usage ELEVE Capytale (historique complet), nb moyen de ressources consultees, nb clics Capytale. Discute l endogeneite (une formation presentiel donnee dans un etab qui utilisait DEJA Capytale gonfle la conversion). Exploite presentiel_etabs.csv (154 etabs, usage_after_formation) comme quasi-experiment. Mesure le delai formation->1er usage Capytale au grain etab. Le webinaire touche des profs plus disperses (moins d UAI declare) mais tres engages cote ressources (7 clics/pers) : creuse ce contraste. Conclus sur le rendement reel de chaque format et la part de recence.` },
  { key:'deux_portes', title:'Les deux portes : site-first vs Capytale-direct',
    brief:`Caracterise les DEUX populations. (1) Capytale-direct : 77 UAI (44%) avec usage Capytale mais AUCUN compte site declarant cet UAI. Qui sont-ils ? geo, type (lycee/college), IPS, activites (l Intro-IA 2548348 quasi absente du site = signal de porte Capytale-directe ; 2 clics site seulement), volume eleves. (2) Site-only : 511 UAI (83%) avec compte/forme mais AUCUNE trace classe Capytale. Decompose : formes vs nouveaux ? recents (pas eu le temps) ? hors_lycee ? etranger ? Estime des bornes hautes/basses de chaque porte. Croise avec match_candidates pour illustrer des profs site-first averes.` },
  { key:'geo_canaux', title:'Geographie croisee et canaux de decouverte',
    brief:`Ou la presence SITE diverge de l USAGE classe ? Utilise geography dans facts_cross + volet1 geo. Cas saillants : Lille (1336 eleves, hub historique) ; Montpellier (79 formes mais usage eleve modeste) ; Versailles/Paris (beaucoup de comptes) ; Etranger (comptes, 0 Capytale) ; academies a forte conversion vs faible. Analyse les CANAUX de decouverte via sessions.referrer (Google = recherche organique ; sendibm = emailing Brevo/newsletter ; youtube ; capytale2.ac-paris.fr = flux inverse Capytale->site) et deviceType. Quelle part de la notoriete vient de l organique vs des campagnes vs du bouche-a-oreille formation ?` },
  { key:'temporel_retention', title:'Temporalite, cohortes et retention',
    brief:`Dynamique temporelle. Cohortes de formation par mois+type (formation_cohorts) : lis la conversion en tenant compte de la RECENCE (les cohortes 2026-03..06 ont peu de recul). Sequence compte vs formation (same_day 235 / avant 71 / apres 180 / sans date 152) : nuance l hypothese "compte d abord puis formation". Saisonnalite des creations de compte et des formations (rentree, janvier). Croise avec la retention Capytale du volet1 (re-usage annee suivante, multi-activite, multi-classe). Les formes re-utilisent-ils plus ? Mesure ce qui est mesurable et signale les angles morts (anciennete tracking).` },
  { key:'ressources_contenu', title:'Ressources et contenus : ce que les profs consultent',
    brief:`Que consultent les profs sur le site avant/autour de l usage ? Depuis consultation_rss + events : top ressources (slides prof/eleve, version_eleve PDF par sequence, basthon, overleaf, guide connexion Capytale), par TYPE (resourceType) et par activite. Compare formes vs nouveaux (profondeur de consultation). Clics Capytale par activite (capytale_clicks_by_activity) : Equation reduite (122) et Stat (116) en tete cote site, MAIS Intro-IA quasi nulle (porte Capytale). Videos de formation (video_view : "machines a trier la Poste", "maths au coeur de l IA", "Utiliser les notebook Capytale"...) : lesquelles vues, par qui. Relie au modele : la vitrine Stat, l Equation reduite tres "formation".` },
  { key:'appariement_bonus', title:'Appariement individuel (bonus) et etudes de cas pipeline',
    brief:`Exploite match_candidates.csv (46 paires : 29 confiance A timing clic->clone, 17 confiance B UAI 1:1) et match_validation.json. Evalue la FIABILITE (faux positifs possibles ? UAI partages ?). Pour 4-6 profs apparies, reconstitue la CHAINE COMPLETE pseudonymisee : creation compte -> (formation: type/date) -> clics ressources/videos -> clic Capytale -> test Capytale (role=teacher) -> classe (role=student, taille) -> re-usage. Choisis des cas CONTRASTES (un presentiel converti vite ; un webinaire ; un nouveau sans formation arrive par Google ; un college). Donne le profil-type du prof qui va au bout. Sois explicite sur l incertitude.` },
  { key:'college', title:'College : reconciliation site x Capytale',
    brief:`Reprends la tension du volet 1 (college "marginal" cote KPI prof, mais beaucoup de testeurs college via formation, et points fantomes uai_el). Avec le nouveau jeu nominatif : combien de comptes SITE sont en college (etab_type) ? combien formes ? Combien d UAI college ont un usage ELEVE Capytale reel ? Y a-t-il des profs college apparies (cf match : "College Cesar Franck") ? Le college est-il un public de FORMATION (interet) qui ne se convertit pas en classe, ou un usage classe reel sous-estime ? Tranche avec chiffres. Distingue 6e-3e (pas la cible 2nde) : qu enseignent-ils ?` },
]

phase('Investigate')
const sections = await pipeline(
  THEMES,
  (t) => agent(
    `${SHARED}\n\n## TON THEME : ${t.title}\n${t.brief}\n\nProduis une section publiable (450-800 mots), 5-10 statistiques parlantes (chacune avec sa source/calcul), des etudes de cas pseudonymisees si pertinent, les drapeaux qualite-donnees, et 1-3 specs de graphiques avec donnees chiffrees pretes a tracer. Ecris tes scripts dans le scratchpad (prefixe ${t.key}_). Reste fidele a facts_cross.json ; si tu recalcules autre chose, signale-le dans data_quality_flags.`,
    { label:`inv:${t.key}`, phase:'Investigate', schema: SECTION_SCHEMA, effort:'high' }
  ).then(sec => ({ theme:t, sec })),
  // verification : recalcul independant des key_stats
  ({theme, sec}) => agent(
    `${SHARED}\n\n## VERIFICATION ADVERSARIALE — theme "${theme.title}"\nVoici des affirmations chiffrees produites par un analyste. Recalcule INDEPENDAMMENT chacune depuis les donnees brutes (snapshot + CSV Capytale), sans faire confiance a facts_cross.json. Pour chaque : indique ta valeur recalculee et si tu es d accord (tolerance raisonnable d arrondi). Sois sceptique : cherche les erreurs de fenetre de tracking, de double-comptage, de role, d UAI fantome, d endogeneite presentee comme causalite.\n\nAFFIRMATIONS :\n${JSON.stringify(sec.key_stats, null, 1)}\n\nPROSE (pour reperer les sur-interpretations) :\n${sec.prose_markdown.slice(0, 2500)}\n\nEcris tes scripts dans le scratchpad (prefixe verify_${theme.key}_).`,
    { label:`ver:${theme.key}`, phase:'Verify', schema: VERDICT_SCHEMA, effort:'high' }
  ).then(verdict => ({ theme:theme.key, title:theme.title, sec, verdict }))
)

const ok = sections.filter(Boolean)
log(`${ok.length}/${THEMES.length} themes investigues+verifies`)
const problems = ok.filter(s => s.verdict?.overall === 'probleme_majeur')
log(`drapeaux verif : ${problems.map(p=>p.theme).join(', ') || 'aucun probleme majeur'}`)

phase('Synthesize')
const synth = await agent(
  `${SHARED}\n\n## SYNTHESE FINALE\nVoici ${ok.length} sections verifiees du rapport Volet 2. Produis :\n1) un RESUME EXECUTIF (8-12 puces percutantes, chiffrees, qui racontent le pipeline complet et l effet des formations) ;\n2) un ORDRE de sections recommande et un titre de rapport ;\n3) 5-8 INSIGHTS TRANSVERSES qui n apparaissent dans aucune section isolee (croisements entre themes) ;\n4) les 3-5 RECOMMANDATIONS operationnelles pour MathAData (convertir les fuites identifiees) ;\n5) la liste consolidee des DRAPEAUX qualite-donnees et limites a afficher honnetement.\nRends un markdown unique, dense, en francais, pret a coiffer le rapport.\n\nSECTIONS (titre + prose + stats + verdict de verification) :\n${JSON.stringify(ok.map(s=>({title:s.title, prose:s.sec.prose_markdown, stats:s.sec.key_stats, verdict:s.verdict?.overall, corrections:s.verdict?.corrections||[]})), null, 1).slice(0, 90000)}`,
  { label:'synthese', phase:'Synthesize', effort:'high' }
)

return {
  exec_synthesis: synth,
  sections: ok.map(s => ({ theme:s.theme, title:s.title, prose:s.sec.prose_markdown, key_stats:s.sec.key_stats,
    case_studies:s.sec.case_studies, data_quality_flags:s.sec.data_quality_flags, chart_specs:s.sec.chart_specs,
    verdict: s.verdict?.overall, corrections: s.verdict?.corrections||[], checks: s.verdict?.checks||[] })),
}
