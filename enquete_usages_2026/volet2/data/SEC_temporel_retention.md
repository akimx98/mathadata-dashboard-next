# Temporalite, cohortes et retention  [verdict: corrections_mineures]

## Une diffusion qui s'accelere mais reste tres saisonniere

La trajectoire de MathAData est nettement ascendante. Cote usage Capytale, les eleves touches passent de 150 (2023-2024) a 2 181 (2024-2025) puis 4 479 (2025-2026), soit un doublement annuel. Cote site, les creations de compte explosent en janvier 2026 : **975 comptes sur ce seul mois**, contre 298 en decembre 2025 et une centaine les mois ordinaires. Mais ce pic est trompeur : 784 de ces 975 comptes sont des inscriptions newsletter-only, et seuls 144 declarent un UAI. La saisonnalite est donc double. Les *inscriptions* suivent les temps forts de communication (decembre-janvier) ; l'*usage en classe*, lui, suit le calendrier pedagogique. Les seances Capytale culminent en mai (70 seances) et mars (51), creux total l'ete (2-3 en aout-septembre), et se concentrent en milieu de semaine (lundi-mardi : 135 des 348 seances datees, contre 9 le week-end). Le TP MathAData est un objet de fin d'annee scolaire, deploye une fois le programme avance.

## La sequence compte / formation contredit le modele lineaire

Le scenario implicite « le prof cree un compte, puis se forme, puis enseigne » ne tient pas. Sur les 638 formes, la sequence se repartit en 235 *meme jour*, 71 compte *avant* la formation, 180 compte *apres*, et 152 sans date exploitable. Surtout, les inscriptions le jour meme de la formation sont a **90 % issues de formations en presentiel (186 sur 206)** : le formateur fait creer le compte seance tenante. A l'inverse, parmi les profs dont le compte est posterieur a la formation (185 cas stricts), on retrouve davantage de webinaires. Autrement dit, il n'y a pas un pipeline mais deux portes d'entree temporelles : le presentiel genere une adhesion synchrone (compte + decouverte le meme jour), le webinaire une adhesion differee (le prof revient creer son compte plus tard, ou jamais).

## La conversion « jusqu'a la classe » se mesure en trimestres

C'est le resultat le plus important pour lire les cohortes. En regroupant les cohortes de formation par maturite, les cohortes **mures** (formees avant decembre 2025, soit plus de six mois de recul) affichent **46,5 % d'etablissements a usage eleve Capytale** (20 sur 43 a UAI connu), contre seulement **22,0 % pour les cohortes recentes** (2026-01 a 2026-06, 53 sur 241). Cet ecart n'est pas une baisse de qualite : c'est l'effet du recul. Un prof forme en mars n'a souvent pas encore eu de creneau pour deployer le TP avant la fin de l'annee. Les cohortes recentes 2026-03, 2026-04 et 2026-06 montrent des taux planchers (5,1 %, 4,5 %, 2,7 %) qui remonteront mecaniquement a la rentree. Lire ces cohortes au present revient a sous-estimer leur rendement final. A l'inverse, la cohorte presentiel mure convertit a 58,8 %, le meilleur taux observe.

## Les formes re-utilisent, mais la base reste jeune

La retention multi-annee est la limite structurelle du dispositif a ce stade. Sur les enseignants ayant reellement enseigne, **192 n'ont enseigne qu'une seule annee scolaire, 28 deux ans, 4 trois ans**. Le taux de retention 2024-2025 vers 2025-2026 est de **29,5 %** (26 profs sur 88 reconduits), et **81,5 % des enseignants de 2025-2026 sont nouveaux**. Le dispositif croit donc par recrutement, pas (encore) par fidelisation : c'est normal pour un produit en phase d'expansion, mais cela signale que la prochaine bataille est la re-utilisation annee N+1. Les signaux positifs existent neanmoins : les profs qui restent diversifient leurs activites (le pionnier de Haubourdin couvre 7 activites sur 3 ans, 404 eleves), et la multi-activite progresse fortement (Geometrie reperee passe de 2 a 400 eleves en un an, Equation cartesienne de 0 a 300). La retention au grain *etablissement* est plus solide que la retention au grain prof, l'usage migrant souvent entre collegues d'un meme UAI.

## Angles morts

Deux biais doivent encadrer la lecture. Le tracking des clics ne demarre que le 27 novembre 2025 : les taux de clic Capytale des cohortes mures (12,7 %) sont sous-captures et non comparables aux cohortes recentes (35,9 %). Et la couverture UAI est tres inegale (43 UAI connus sur 213 profs mures, contre 241 sur 273 recents), ce qui rend le taux de conversion des cohortes mures plus volatil. La conversion au grain etablissement sur l'historique Capytale complet (2023-2026) reste, elle, non biaisee.

## KEY STATS
- Pic de creations de compte janvier 2026: 975 comptes  (Pic de communication ; majoritairement newsletter, pas d'usage immediat; src: payload_users_work.csv, count(acct_month=='2026-01'); dont 784 newsletter_only et 262 formes)
- Inscriptions le jour meme de la formation issues du presentiel: 186 / 206 (90%)  (Le presentiel genere une adhesion synchrone ; le webinaire une adhesion differee; src: payload_users_work.csv : same-day createdAt==fdate, ventile par ftype)
- Conversion 'jusqu'a la classe' des cohortes mures (formees avant 2025-12): 46,5% (20/43 UAI connus)  (Plus de 6 mois de recul ; vs 22,0% pour cohortes recentes; src: facts_cross.json formation_cohorts, agregation par maturite (temporal_retention_cohort.py))
- Conversion des cohortes recentes (2026-01 a 2026-06): 22,0% (53/241 UAI connus)  (Recul insuffisant : ces taux remonteront a la rentree; src: facts_cross.json formation_cohorts agrege)
- Meilleur taux : presentiel mur: 58,8% (10/17)  (Faible n mais coherent avec l'effet presentiel; src: facts_cross.json, cohortes presentiel month<=2025-12)
- Taux de retention prof 2024-2025 -> 2025-2026: 29,5% (26/88)  (81,5% des enseignants 2025-2026 sont nouveaux : croissance par recrutement; src: facts.json growth.retention)
- Profs ayant enseigne plusieurs annees: 28 sur 2 ans, 4 sur 3 ans (vs 192 sur 1 an)  (Base encore jeune ; fidelisation a construire; src: facts.json temporal.n_sy_taught_dist)
- Saisonnalite des seances en classe: pic mai (70) et mars (51), creux ete (2-3)  (TP de fin d'annee, decorrele du pic d'inscription hivernal; src: facts.json temporal.classes_by_month)
- Croissance des eleves touches: 150 -> 2181 -> 4479 (x2/an)  (Diffusion par expansion plus que par retention; src: facts.json growth.usages_by_sy)

## CASE STUDIES
### Cohorte presentiel rentree 2024 (octobre, academie de Lille)
Cohorte de 40 profs formes en presentiel en octobre 2024. Plus de 18 mois de recul : 5 sur 6 UAI connus presentent un usage eleve Capytale (66,7%), le taux de conversion le plus eleve des cohortes datees. Ce groupe illustre le rendement reel d'une formation presentiel une fois le temps de deploiement ecoule, et sert d'etalon pour projeter les cohortes 2026 encore immatures.

### Etablissement pionnier multi-annees (lycee, Haubourdin)
Compte fondateur (md5 cfcd2084) actif sur les trois annees scolaires 2023-2024 a 2025-2026, 404 eleves uniques, 48 seances, 7 activites distinctes. Cas extreme de retention et de diversification : montre que la fidelite, quand elle existe, s'accompagne d'un elargissement du repertoire d'activites. A traiter comme hub fondateur, non comme prof local representatif.

### Cohorte presentiel mars-avril 2026 (effet recence)
Profs formes en presentiel en mars (39) et avril (23) 2026, quasi tous a UAI connu mais taux d'usage classe planchers (5,1% et 4,5%). Non un echec mais un artefact temporel : la fin d'annee ne laisse pas de creneau pour deployer le TP. Vignette a suivre a la rentree 2026 pour mesurer la conversion differee.

## CHART SPECS
- [grouped] Creations de compte vs seances en classe par mois (deux saisonnalites): {"x":["2025-09","2025-10","2025-11","2025-12","2026-01","2026-02","2026-03","2026-04","2026-05","2026-06"],"series":[{"name":"Comptes crees (site)","values":[165,101,75,298,975,84,131,160,104,87]},{"name":"Seances Capytale (eleves, par mois calendaire toutes annees)","values":[3,4,6,14,29,27,51,43,70,47]}],"note":"Comptes: payload_users_work.csv acct_month. Seances: facts.json temporal.classes_by_month (1..12 mappes). Pic inscription hiver vs pic usage printemps."}
- [grouped] Conversion 'jusqu'a la classe' par maturite et type de formation: {"x":["Presentiel","Webinaire"],"series":[{"name":"Cohortes mures (>6 mois recul)","values":[58.8,38.5]},{"name":"Cohortes recentes (2026)","values":[20.6,28.6]}],"unit":"% etablissements a usage eleve Capytale (UAI connus)","note":"facts_cross.json formation_cohorts agrege par maturite. Mures presentiel 10/17, web 10/26 ; recentes presentiel 41/199, web 12/42."}
- [bars] Retention des enseignants : nombre d'annees scolaires d'enseignement: {"x":["1 annee","2 annees","3 annees"],"values":[192,28,4],"note":"facts.json temporal.n_sy_taught_dist. Retention 2425->2526 = 29,5%, 81,5% de nouveaux en 2025-2026."}

## CORRECTIONS (verif)
- Prose, sequence compte/formation : la ventilation '235 meme jour / 71 avant / 180 apres / 152 sans date' est incorrecte. Recalcul depuis payload_users_work.csv (hors sentinelle 1984-01-01) : meme jour=206, avant=95, apres=185, sans date=152. Seul le 152 concorde. L'affirmation chiffree formelle (186/206=90% presentiel le jour meme) reste exacte ; corriger uniquement les trois autres nombres de la phrase.
- Prose, saisonnalite : '135 des 348 seances datees' -> le total des seances datees est 294 (somme de classes_by_month et de classes_by_dow). Remplacer 348 par 294. Le ratio lun+mar=135 et week-end=9 sont corrects. (348 = nb de lignes role=teacher dans Capytale, sans rapport avec les seances.)
- Prose/claim, creux d'ete : ecrire 'creux total l'ete' est exact mais '(2-3)' est imprecis : septembre=3, aout=0 (absent de la distribution). Preferer 'aout nul, septembre 3'.
- Claim 'eleves touches 150->2181->4479' : ces valeurs sont des LIGNES eleve (clones distribues), pas des eleves DISTINCTS. Les eleves distincts sont 146/1943/3783. Si le libelle dit 'eleves touches', utiliser les distincts ou preciser explicitement 'lignes/affectations eleve'.
- Glose '(x2/an)' : la croissance n'est pas un doublement constant. Premier saut ~x14 (montee en charge), second saut ~x2. Reformuler en 'forte montee initiale puis doublement'.
## FLAGS
- Tracking des clics/modules/events demarre le 27-11-2025 : les taux de clic Capytale des cohortes formees avant cette date (12,7%) sont sous-captures et NON comparables aux cohortes recentes (35,9%). Seul l'usage ELEVE Capytale (historique complet 2023-2026) est non biaise.
- Couverture UAI tres inegale entre cohortes : 43 UAI connus sur 213 profs mures contre 241 sur 273 recents. Le taux de conversion des cohortes mures (46,5%) repose donc sur une petite base et est plus volatil ; il pourrait sur-representer les profs les plus engages (ceux qui ont renseigne leur UAI).
- Recence : les cohortes 2026-03 a 2026-06 ont moins de 4 mois de recul ; leurs taux de conversion 'jusqu'a la classe' (2,7% a 14,3%) sont des bornes basses qui remonteront a la rentree. Ne pas les comparer en niveau aux cohortes mures.
- Sequence compte/formation : 152 des 638 formes n'ont pas de date de formation exploitable (sentinelle 1984-01-01 cote webdecouv). La repartition same_day/avant/apres porte donc sur 486 cas, biaisee vers le presentiel mieux date.
- Saisonnalite des seances calculee sur 348 seances Capytale datees (facts.json temporal) ; volume faible sur les mois de creux, lecture indicative.
- Retention prof (29,5%) sous-estime la continuite reelle : l'appariement Capytale est anonyme et un prof changeant de compte ENT ou d'etablissement apparait comme nouveau. La retention au grain etablissement est plus fiable.