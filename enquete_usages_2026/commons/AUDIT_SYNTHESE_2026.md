# Audit adversarial de la synthèse 2026

**Date** : 21 juin 2026 · **Objet** : vérifier la *synthèse elle-même* (pas seulement ses sources) — chaque affirmation portante re-dérivée indépendamment depuis les données brutes, avec contrôle du grain, du dénominateur, des mesures concurrentes, de la circularité et de la surinterprétation.

**Méthode** : re-calcul indépendant (pandas) de ~45 affirmations par 6 vérificateurs adversariaux (croissance, formation/Volet 2, géographie, prédicteurs §IV, glossaire inter-documents, skeptic réfutant les 3 affirmations qui portent la thèse), puis intégration en raisonnement unifié. Données 100 % pseudonymisées.

---

## Verdict global

**La thèse tient ; sa charpente factuelle est en grande partie solide ; mais un défaut grave se concentre au cœur du document (le tableau §IV), plus une dizaine de glissements de grain/dénominateur.**

- **Ce qui est confirmé exact et robuste** (grand n, reproductible) : +105 % (sur lignes-usage), 631 formés, le facteur ~6 formation ciblée/masse (direction), 44 % Capytale-direct, 80 % établissements solo, deltas de contenu (+1340/+1236/−485), 401/224/140/37, paradoxe du déployeur (cardinaux exacts), médianes de séances (7 min, 66 % <15 min, 20 % ≥45 min, 45 % le matin), multi-prof n'améliore pas la rétention.
- **La requalification du « 4 % » est correcte** : le Volet 2 ne le présente nulle part comme une conversion ; l'erreur passée est bien neutralisée.
- **Défaut HAUT (à corriger) : les deux lignes phares du tableau §IV (« 76 % » et « 61 % ») sont des mesures *carrière entière* affichées sous l'en-tête « geste posé dès la 1ʳᵉ année », mécaniquement circulaires, et divergentes du propre fichier de faits du projet.** La direction survit sur les mesures année-1 honnêtes (64/25), mais l'ampleur est gonflée et la ligne « 45 min » année-1 n'est pas significative.
- **La thèse, reformulée honnêtement, reste vraie** : la notoriété est acquise, la conversion (à trois étages) est l'enjeu, et un geste de profondeur *posé dès l'année 1* est associé à un retour plus fréquent — mais associé, pas démontré, et avec des écarts plus modestes qu'affichés.

---

## A. Registre des affirmations

Légende verdict : ✅ exact · 🟡 exact mais grain/dénominateur à préciser · 🟠 fragile (petit n / confondu / mono-source) · 🔴 défaut (mauvais grain ou non reproductible).

### A.1 — Défauts à corriger (sévérité HAUTE)

| # | Affirmation (synthèse) | Affirmé | Re-dérivé (mesure honnête) | Verdict | Le problème |
|---|---|---|---|---|---|
| IV-1 | ≥ 2 activités **dès l'an 1** → retour | **76 % vs 16 %** | **64 % vs 25 %** (année-1, `y1_act`, n=14 ; Fisher p=0,009, OR 5,3) | 🔴 | 76/16 = `n_activities_taught` **carrière entière**. Le projet stocke pourtant 64/25 dans `facts_investigation.json`. **Circularité** : 11/25 (44 %) des « ≥2 activités carrière » ont fait la 2ᵉ activité une année *ultérieure* — ce qui exige d'être revenu. |
| IV-2 | ≥ 1 vraie séance 45 min classe entière **dès l'an 1** → retour | **61 % vs 20 %** | Carrière 61 % vs **26 %** (n=13) ; **année-1 37 % vs 30 %** (n=8, p=0,70 — **non significatif**) | 🔴 | 61 % = carrière entière. Le « **vs 20 % » est faux** : emprunté à la ligne one-shot ; le vrai contrôle est 26 %. En année-1 (ce que dit l'en-tête) l'effet **disparaît**. |
| III/V | « 28 % des profs font ≥1 vraie séance de 45 min en classe entière » (63/224) | 63/224 = **28 %** | 63/224 = 28 % **si « classe entière » = ≥10 élèves** ; **17 % si >20** | 🟠→🟡 | Le chiffre est exact, mais « classe entière » y signifie **≥10** alors qu'ailleurs (déployeur, prédicteur) il signifie **>20**. Dérive de définition, pas chiffre faux. |

> **Conséquence pour la thèse §IV.** La règle « la profondeur de l'année 1 prédit la durée » **survit** sur les mesures honnêtes : ≥2 activités an-1 → **64 % vs 25 %** (significatif) et ≥2 séances an-1 → **40 % vs 20 %** (p=0,03). Mais : (a) remplacer 76/16 et 61/20 par les valeurs année-1 ; (b) la ligne « 45 min » année-1 n'étant pas significative, la **retirer ou la dégrader en « piste non confirmée »** ; (c) ne jamais citer le « 0 % pour <2 séances » (tautologique).

### A.2 — À nuancer (sévérité MOYENNE)

| # | Affirmation | Affirmé | Re-dérivé | Verdict | Réserve |
|---|---|---|---|---|---|
| I-1 | « plus que doublé » / +105 % | 2181→4479 (+105 %) | +105 % sur **lignes-usage** ; **+95 % en élèves distincts** (1943→3783) | 🟡 | « élèves » suggère des personnes : en personnes c'est +95 %, donc **pas tout à fait « doublé »**. Préciser « usages élèves ». |
| I-2 | Récurrents : effet net quasi nul | 1065 vs 1062 | Identité exacte **sur lignes-usage** ; en **élèves distincts −13 %** (921→797) ; via taille-max +17 | 🟠 | « Quasi nul » est un **artefact de métrique** (lignes-usage sur-comptent les séances répétées). n=26, IC large. Reformuler en « contribution marginale / appoint ». |
| I-3 | Classe entière dès l'an 1 : 5 % → 44 % → 57 % | 5/44/57 | Reproduit **seulement** avec `y1_max_sess ≥ 15` (1/21, 35/80, 70/123) ; **0/48/50 si >20** | 🟠 | 4ᵉ acception de « classe entière » (≥15 dans une séance), non documentée. Direction (mue vers la 2nde) robuste, mais **pinner la définition**. |
| VI-5 | Présentiel ~17-23 % | 17-23 % | 17 % = **établissement** (26/152) ; 23 % = **prof** (gonflé par non-dédup) | 🔴 | La fourchette **fond deux grains** : ce ne sont pas deux estimations d'une même métrique. Donner 17 % (étab.) et 23 % (prof) séparément. |
| VI-6 | 46 % cohortes mûres | 46 % (20/43) | 20/42 = **47,6 %** | 🟠 | n=42 UAI ; **confondu** avec la cohorte ciblée Lille-2024 ; si on la retire le taux s'effondre. Couverture UAI sélective. « Ordre de grandeur, porté par 1-2 cohortes ciblées ». |
| VI/Lille | 67 % Lille oct-2024 | 66,7 % | 4/6 (exact) | 🟠 | **n=6 UAI**. La même cohorte sert claims 2, 6 **et** 7 : un seul signal compté trois fois. |
| V-3/VIII | Délai formation → 1ʳᵉ séance ~27 j | ~27 j | 14 j (SEC) / 27 j (facts) / **37 j** (recalcul), n≤23 | 🟠 | Instable ×2,6 selon la méthode. Le message « relancer à J+45 » tient ; dire « quelques semaines ». |
| V-3 | Guide Capytale : 74 % cliquent **ensuite** | 74 % | 71/96 = 74 % (exact) | 🟠 | Mono-source, n=96, et « **ensuite** » suppose un ordre temporel **non vérifié** (co-occurrence ≠ séquence). Retirer « ensuite », dégrader « marqueur le plus fiable ». |
| VI/VII | Lille capte 26 % des élèves | 26 % | 1336/5057 = 26,4 % (num. Capytale-géoloc / total tronqué) ; **29 % sur élèves uniques**, 31 % sur somme by-académie | 🟡 | Num. ≠ `n_eleves` (1696), dénom. = coupe top-25 que le rapport signale comme artefact. « ~30 % » est aussi défendable. Préciser le périmètre. |
| Séances | « ~5 970 participations-élèves » (en-tête Séances) | 5 970 | 5 854 distincts ; **6 810 participations** | 🔴 | Doublement faux : 5 970 = somme des distincts par prof (double-compte les partagés). Écrire « 5 854 élèves distincts (6 810 participations) ». |
| II/IV | Déployeur : 0/41 reviennent | 0/41 | Exact (cardinaux 105/41/0, méd 19) | 🟠 | **Partiellement tautologique** : « déployeur » est un résidu qui exclut les multi-années → « 0 retour » est en partie dans la définition. Le 44 % porte sur les **41 éligibles**, pas le cluster de 105. |

### A.3 — Exactes, réserve mineure ou nulle (sévérité BASSE / nulle)

| Affirmation | Verdict | Note |
|---|---|---|
| 631 comptes formés | ✅ | 3 sources concordantes. Ne pas enchaîner 1712→631 (188 nl-only). |
| Ciblée 59 % (13/22) · masse 10 % (13/129) · facteur ~6 | 🟡 | Arithmétique exacte, direction robuste ; base 22 étab., classification par mots-clés **subjective** + circularité (la « nature » est corrélée au résultat). |
| Webinaire ~30 % (18/61) | ✅ | Exact (32 % au grain prof). Auto-sélection des inscrits. |
| Endogénéité 9/26 | ✅ | « Environ un tiers » de l'usage présentiel pré-existait (autres méthodes : 9/32, 10/27). |
| Pré-service 20 %, 0 % d'usage | 🟡 → **corrigé (§C-4)** | À l'audit : 74/363 « pré-service » (ENS_25 52 + MEEF 13 + INSPÉ 9). **Réfuté par l'équipe** : ENS_25 = profs *en exercice* (formation ouverte ratée) → reclassé en masse dans le pipeline. **Pré-service réel = MEEF (~13, ~4 %)** ; `pre-service` de `facts_formation.json` = 13. |
| 509 site-only · 75 % datés 2026 | 🟡 | Exact (380/509). Borne haute (75 appariements cachés). Récence en partie artefact de la fenêtre de tracking (27 nov.). |
| ~148 cliqué Capytale sans classe | 🟡 | Exact. Borne basse (clic sous-capturé avant 27 nov.). |
| 44 % Capytale-direct (77/174) | ✅ | Exact ; effectif 77→166 selon grain teach/el. |
| 63 profs « n'utilisent qu'Intro IA » | 🟡 | Compte exact (grain prof ; 41 au grain étab.). « **ne voient jamais le catalogue** » = interprétation **non observable**. |
| Multi-prof 30 % vs solo 31 % | ✅ | Écart nul confirmé (p=0,87). |
| 80 % établissements solo (146/182) | ✅ | Exact. |
| Contenu +1340 / +1236 / −485 | ✅ | Exact à l'unité. |
| Noyau 3 ans = 4 | ✅ | Exact (small n : toute généralisation porte sur 4 profs). |
| 25/32 pluriannuels démarrés modestement | ✅ | Exact ; rétrospectif sur survivants (usage correct : réfute « génie d'emblée »). |
| ≥2 séances 40/20 · entrée milieu d'année 53/27 · one-shot 19 % | ✅ | **Les 3 lignes honnêtes du tableau §IV**, reproduites exactement, fidèles aux faits. |
| 66,7 % référencement / 6,1 % Brevo | 🟠 | Cohérent en interne mais **mono-source** (logs absents du dépôt) ; dénom. = sessions référencées (45 % exclues) + fenêtre récente. Sur 25 908 sessions, organique ~37 %. |
| Rétention « 30/29,5/31 convergent » | 🟠 | 3 **dénominateurs différents** (88 / typologie / 101) présentés comme convergence — coïncidence de bases voisines, pas triangulation indépendante. Le récit ~30 % tient. |
| Nouveaux 123 (81,5 %) vs 125 (83 %) | 🟡 | Incohérence inter-fichiers de **2 profs** (revenants après trou). Prose publiée alignée sur 123. |

---

## B. Glossaire figé (à fixer en amont des prochaines synthèses)

Une grande part des défauts sont **définitionnels**. Geler ces termes, avec grain et dénominateur, et s'y tenir.

| Terme | Définition retenue | Grain | Dénominateur | ⚠️ Dérives observées |
|---|---|---|---|---|
| **Engagé** | a cloné/testé ou enseigné | compte Capytale | 401 | — |
| **A enseigné** | ≥1 ligne élève réelle | compte Capytale | 224 | — |
| **Vu seulement en formation** | clone créé en séance de formation, jamais déployé | compte Capytale | ~140 | **Ne pas dire « stagiaire »** (profs en exercice, sauf pré-service ENS/MEEF). Résidu dans `DEFINITIONS.md`. |
| **Testeur / distributeur** | a cloné/distribué, aucun élève connecté | compte Capytale | ~37 | — |
| **Séance** | cluster de clones élève (même prof+activité+étab, gaps <3 h) | séance reconstruite | 738 | Médiane span **7 min** = étalement, pas durée de travail (34,5 min/élève). |
| **Classe / classe entière** | **À FIXER — 4 acceptions en circulation** | — | — | 🔴 (a) séance ≥10 él. (« Classe » canonique, KPI 28 %) ; (b) **>20 él. cumulés/an** (`y1_el`, déployeur 44 %, prédicteur) ; (c) séance max ≥15 él. (trajectoire 5/44/57) ; (d) ≥10 cumulés/an (163 « vraies classes » Volet 2). **Choisir une seule par usage et la nommer.** |
| **Retour / rétention / éligible** | a ré-enseigné l'année suivante | prof | **101 éligibles** (entrés ≤2024-25) → 31 % ; *ou* 88 (a enseigné en 24-25) → 29,5 % | Deux dénominateurs voisins ; éviter le mot « convergent ». |
| **Déployeur** | atteint une vraie classe mais résidu mono-année | prof | 105 (cluster) / 41 (éligibles) | « 0 retour » partiellement induit par la définition (exclut le multi-années). |
| **Usages élèves** | **lignes-usage** (clone × élève × activité) | ligne | 4479 (25-26) | ≠ élèves distincts (3783). +105 % en lignes, +95 % en personnes. |
| **Formation : ciblée / masse / webinaire / pré-service** | par nature de cohorte | **établissement (UAI)** | 22 / 129 / 61 / 13 (pré-service = MEEF seul ; ENS_25→masse) | Au grain **prof** les taux montent (ciblée ~67 %, présentiel 23 %) — ne pas mélanger les grains dans une même fourchette. |
| **Formé** | a un code de formation (`trainedFormation`) | compte site | 631 | Ne pas dériver 631 de 1712 (188 sont newsletter-only). |

---

## C. Hypothèses portantes à valider par l'équipe

Ce que les données **ne peuvent pas trancher** et qui conditionne des conclusions — à cocher/barrer par toi (tu valides des hypothèses, pas de la prose).

1. **« Classe entière » — quelle définition métier ?** Pour le pilotage 2026-27, « une vraie séance en classe entière » = **≥10** élèves présents, ou **>20** ? (Le choix change le KPI de 28 % à 17 % et l'ampleur du « paradoxe du déployeur ».) → *à fixer par toi.*
2. **Le geste qui compte est-il « 2ᵉ activité » ou « 2ᵉ séance » ?** Les deux sont des prédicteurs année-1 honnêtes (64/25 et 40/20). La « séance de 45 min » n'a **pas** d'effet année-1 significatif (n=8). Le playbook doit-il pousser la 2ᵉ activité (solide) plutôt que la « séance 45 min » (non confirmée) ? → *priorité opérationnelle à valider.*
3. **Classification des formations** (ciblée vs masse vs webinaire) faite par **mots-clés sur les libellés** : est-elle fiable ? Des cas-frontière (Calais-LP, Amiens) portent le « facteur 6 ». → *valider la nature réelle de ces cohortes.*
4. **Pré-service** : confirmer que ENS_25 (52) + MEEF Paris (13) sont bien sans classe **par construction** (et donc à sortir du KPI immédiat), et que les 9 INSPÉ-26/11 sont, eux, des profs en exercice. → *connaissance terrain.*
5. **Délai formation → séance** : la cible « relancer à J+45 » suppose un délai « quelques semaines ». La vraie valeur (14 / 27 / 37 j) dépend de la date de formation que **vous** connaissez. → *valider l'ordre de grandeur.*
6. **« 44 % Capytale-direct »** repose sur l'appariement UAI site↔Capytale (ténu). Combien de ces 77 établissements ont *réellement* un compte sous un autre UAI/ENT ? → *seule l'équipe peut estimer le faux-négatif.*
7. **Canaux d'acquisition (66,7 % référencement)** : les logs bruts ne sont pas dans le dépôt → invérifiable en aval. Confirmer la fenêtre (depuis 27 nov.) et que ce n'est pas qu'un effet « visites récentes ». → *accès analytics.*

> **Réponses de l'équipe (21 juin 2026) — intégrées aux livrables :**
> 1. **« Classe entière » = séance ≥ 10 élèves** (inclut les demi-groupes, mode légitime). KPI et prédicteur §IV alignés sur ≥ 10 (le prédicteur passe à « ≥ 1 séance ≥ 10 él. → 38 % vs 22 %, n=55 ») ; le seuil « > 20 » n'est plus employé que pour le paradoxe du déployeur.
> 2. **Pousser la 2ᵉ activité** (prédicteur solide) plutôt que la séance 45 min. ✅ reflété dans le playbook.
> 3. **Classification des formations fiable** : Calais = formation établissement-ciblée en **lycée pro** (expérimentation déploiement LP) ; Amiens = petite formation établissement. Le caveat « classification subjective » est retiré (remplacé par « confirmée par l'équipe »).
> 4. **ENS_25 (52 profs) = profs EN EXERCICE** — formation francilienne **ouverte, non ciblée**, peu efficace et **non reconduite** — **pas** du pré-service. Seul **MEEF (≈13)** est pré-service sans classe. Corrigé partout : le « ~20 % pré-service / 0 % par construction » devient « pré-service réel ~4 % » ; le 0 % d'ENS_25 est compté comme un **échec de formation de masse**, pas excusé.
> 5. **Délai formation → séance** : les dates exactes sont dans `cohorts.csv` → la figure précise **≈ 27 j (médiane, n=17)** est restaurée (le « 14-37 j » de l'audit venait d'un proxy mi-mois d'un agent).
> 6. Faux-négatifs Capytale-direct : indéterminé → le 44 % reste une **borne**.
> 7. Canaux 66,7 % : laissé en l'état (mono-source signalé) — non bloquant.

---

## D. Corrections recommandées (par priorité)

> ✅ **Toutes appliquées le 21 juin 2026** (commit `b36d0f4`) : synthèse (.md + page + chart `syn_double_gain.png` régénéré), Séances, Volet 1, Volet 2 (md + dashboards). gh-pages republié, artifacts Volet 1 / Volet 2 / Typologie redéployés. Reste ouvert : les **hypothèses §C** à valider par l'équipe.

1. **§IV (HAUT)** — remplacer dans le tableau et le dashboard : « 76 % vs 16 % » → **« 64 % vs 25 % (≥2 activités dès l'an 1, n=14, p=0,009) »** ; **retirer** la ligne « séance 45 min → 61/20 » (ou la dégrader en « piste non confirmée : effet année-1 non significatif »). Ajouter une note sur la circularité carrière/année-1. Aligner le hero/strip de la page synthèse (« 76 % vs 16 % » y figure aussi).
2. **§III/§V (MOYEN)** — préciser que « 28 % / 63 profs » utilise « classe = ≥10 élèves » ; harmoniser « classe entière » partout (cf. glossaire).
3. **§I (MOYEN)** — « +105 % » → préciser « usages élèves (≈+95 % en élèves distincts) » ; « 1065 vs 1062 effet net quasi nul » → « contribution marginale des récurrents (n=26, IC large) » ; documenter le seuil de « 5 → 44 → 57 % ».
4. **§VI (MOYEN)** — dissocier « présentiel 17 % (étab.) / 23 % (prof) » ; ajouter caveat n=42 sur « 46 % mûres » et n=6 sur « 67 % Lille » ; « ~27 j » → « quelques semaines ».
5. **§V (MOYEN)** — guide Capytale : retirer « ensuite », reformuler en corrélation.
6. **Rapport Séances (MOYEN)** — en-tête « 5 854 élèves distincts (6 810 participations) ».
7. **BAS** — coquille « 364 » → 363 ; « ne voient jamais le catalogue » → « n'ont déployé qu'Intro IA » ; « convergent » (rétention) → « trois mesures voisines » ; aligner `facts_typologie` (125/5970) sur les valeurs publiées (123/5854).

---

*Audit produit le 21 juin 2026. Tous les re-calculs sont reproductibles depuis `commons/data/`, `volet1/data/`, `volet2/data/` (pseudonymisés). Aucune donnée personnelle.*
