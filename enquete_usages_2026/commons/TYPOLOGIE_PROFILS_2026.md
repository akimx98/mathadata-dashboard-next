# Cinq façons d'enseigner — et pourquoi la plupart ne reviennent pas
## Enquête sur les profils d'usage MathAData, croisés avec toutes les données

**Date** : 20 juin 2026
**Corpus** : 2 715 comptes site (amont, nominatif) · 401 comptes Capytale engagés dont 224 ont enseigné · 5 854 élèves distincts
**Méthode** : clustering k-means (k=5) → 5 archétypes ; puis enquête croisée (10 questions, chacune testée puis **vérifiée de façon adversariale** par un second analyste indépendant) reliant les profils à la rétention, au parcours amont, à la formation, à la géographie et aux trajectoires pluriannuelles.

> Cette note prolonge et **corrige** [`ANALYSE_PATTERNS_USAGE.md`](../../ANALYSE_PATTERNS_USAGE.md) (4 nov. 2025). Elle ne se contente pas de décrire les profils : elle s'en sert comme **grille de lecture** pour répondre à deux questions — *qui atteint la classe ?* et *pourquoi la plupart ne reviennent-ils pas ?*
>
> **Pendant** : [`RAPPORT_SEANCES_2026.md`](RAPPORT_SEANCES_2026.md) — « la séance » (comment l'outil se vit en classe : scénarios, rythmes, cas). Ici « le prof ».

---

## Les deux réponses, en bref

**Qui atteint la classe ?** — 224 des 401 comptes engagés (56 %) enseignent. Atteindre la classe n'est pas dur **en soi** : les profs qui découvrent l'outil **seuls** (sans formation) déploient très majoritairement. Le vrai maillon faible est la **conversion post-formation** : modérée et très inégale (mesurée au grain établissement, [Volet 2](../volet2/RAPPORT_VOLET2.md) : ~17-30 % selon le type, **établissement-ciblée 59 % vs masse 10 %**). ⚠️ Les ~140 profs « vus seulement en formation » sont des **profs en exercice** à activer (un réservoir), *pas* des « stagiaires » sans classe (seule la minorité pré-service INSPÉ/MEEF l'est).

**Pourquoi la plupart ne reviennent-ils pas ?** — Sur 101 enseignants ayant *pu* revenir, **31 % reviennent** l'année suivante. La cause n'est pas le profil (le lien profil→retour est tautologique) mais la **dose de la première année**. Le cœur du problème est le **paradoxe du déployeur** : les déployeurs atteignent une vraie classe — le signal même qui prédit le retour — et pourtant **0 sur 41 reviennent**. La perte n'est pas au premier contact, elle est à la **réengagement d'une année sur l'autre**.

| Chiffre clé | Valeur |
|---|---|
| Comptes engagés qui atteignent une vraie classe | 56 % (224/401) |
| Profs éligibles qui reviennent l'année suivante | **31 % (31/101)** |
| Déployeurs : ont atteint une classe complète (>20) / sont revenus | **44 % / 0 % (0/41)** |
| Retour si ≥2 séances **et** un test en année 1 vs « one-shot » sans test | 62 % vs 19 % |
| Réplication intra-cohorte (2024-25 seule) de cet écart | 56 % vs 12 % |
| Masse critique locale (multi-prof vs solo) — **effet nul** | 30 % vs 31 % (p=0,87) |
| « Effet formation » expliqué par la composition en profils | 54 %/27 % observés = 56 %/27 % prédits par le seul mix |

---

## I. Les cinq profils (la carte)

Le clustering sépare nettement les 224 enseignants en cinq archétypes, sur les axes intensité × durabilité × largeur de catalogue.

| Archétype | n | % | Élèves¹ | Ce qui le définit |
|---|---|---|---|---|
| 🔴 Pionniers intensifs | 38 | 17 % | ~2 400 | 6+ séances, souvent 2 activités ; concentrent l'impact |
| 🟢 Fidèles pluriannuels | 13 | 6 % | 474 | reviennent tous, plus sobres que les pionniers |
| 🔵 Explorateurs multi-activités | 20 | 9 % | 534 | 2+ activités dès l'an 1, ne reviennent pas (encore) |
| 🟠 Déployeurs classe-entière | 105 | 47 % | ~2 400 | une activité, une vraie classe, une fois |
| ⚪ Petits groupes / léger | 48 | 21 % | 172 | ~4 élèves, une séance |

<sub>¹ Somme des élèves uniques par prof ; le distinct global est 5 854.</sub>

**La concentration est le premier fait** : 17 % de pionniers touchent autant d'élèves (~2 400) que les 47 % de déployeurs. L'impact repose sur une avant-garde. ⚠️ *Caveat : le 1ᵉʳ pionnier par élèves est le **hub fondateur** (compte « 0 », 404 élèves répartis sur 14 établissements — cf. [Volet 1](../volet1/RAPPORT_ENQUETE_USAGES.md) §6 et [Séances](RAPPORT_SEANCES_2026.md) §VI). Net de ce hub, les 37 autres pionniers touchent ~2 000 élèves — la concentration reste forte mais légèrement moindre.*

⚠️ **Attention** : pionniers et fidèles sont *définis* à partir de l'usage multi-années. Dire « les pionniers reviennent » est donc circulaire. Toute la suite s'attache à des prédicteurs **non circulaires**, mesurés sur la seule première année.

---

## II. Qui atteint la classe ?

Sur 401 comptes engagés (côté Capytale) : **224 ont enseigné**, **≈140 ne sont vus qu'en formation** (clones créés pendant une séance, jamais déployés), **≈37 ont testé/distribué** une activité sans qu'aucun élève ne s'y connecte.

> **⚠️ Vocabulaire — pas des « stagiaires ».** Les ≈140 « vus seulement en formation » sont, en quasi-totalité, des **profs en exercice** ayant suivi une **formation continue** — *pas* des stagiaires/pré-service. La seule exception, le pré-service (INSPÉ/MEEF), n'est repérable que par les **libellés de formation côté site** (Volet 2), pas côté Capytale, et reste minoritaire.

Le constat utile n'est donc pas « il y a un filtre définitionnel », mais :
- **Les profs qui découvrent l'outil seuls** (sans formation : Capytale-direct, organique) **déploient très majoritairement** — atteindre la classe n'est pas dur en soi.
- **Le maillon faible est la conversion post-formation.** Le taux Capytale brut (6/148 ≈ 4 %) est **trompeusement bas** (récence des formations, grain compte) ; la mesure pertinente est au **grain établissement (Volet 2)** : ~17-30 % selon le type, **46 % pour les cohortes mûres**, et surtout **établissement-ciblée 59 % vs masse 10 %**. Les ≈140 non-déployés sont donc un **réservoir de profs en exercice à activer**, pas des gens « qui ne peuvent pas ».
- Le type d'établissement ne discrimine **pas** une fois ce public de formation mis à part (lycée 87 % vs collège 83 %, n=6 indicatif) : l'écart brut lycée/collège reflète seulement que les comptes collège passent surtout par la formation (cf. Volet 2 §8).

**Conclusion honnête** : « atteindre la classe » n'est pas un problème pour les profs qui arrivent par découverte spontanée ; c'en est un, réel, pour ceux recrutés par une **formation de masse** — et c'est une conversion à travailler (Volet 2), pas une fatalité.

---

## III. Pourquoi la plupart ne reviennent-ils pas ?

### Le cadrage : 31 % de retour, mesuré proprement

Sur 224 enseignants, seuls **101 ont *pu* revenir** : ceux entrés en 2023-24 ou 2024-25, qui ont eu une **année suivante**. Les 123 entrés en 2025-26 n'ont pas encore d'année d'après et sont exclus du taux de rétention. *(L'extraction du 19 juin capte par ailleurs l'année quasi complète : en 2024-25, plus aucune séance après le 12 juin.)* Sur les 101 éligibles, **31 reviennent (30,7 %)**.

### Le paradoxe du déployeur (le cœur)

Le lien profil→retour est spectaculaire mais **tautologique** : fidèles 13/13, pionniers 18/21, tous les autres **0/67**. Il ne *prouve* rien.

Ce qu'il révèle, en revanche, est frappant : les **déployeurs** (le gros du peloton) atteignent une classe complète (>20 él.) à un taux proche des pionniers (**44 % vs 52 %** des éligibles dès l'an 1) — et pourtant **0 sur 41 reviennent**. Atteindre une classe complète **ne garantit pas** de revenir. Les deux échecs sont distincts : le premier contact (réussi par les déployeurs) et le réengagement année→année (raté). **Les déployeurs sont le plus gros gisement de « atteints puis perdus » — la cible de conversion n°1.**

### Ce qui prédit vraiment le retour : la dose de la 1ʳᵉ année

Débarrassé de la circularité, le signal est la **dose** mise dès la première année. Combiné : un prof qui a fait **≥2 séances ET un test** en année 1 revient à **62 % (13/21)** contre **19 % (6/32)** pour un « one-shot » jamais testé — et l'écart **survit dans la seule cohorte 2024-25 (56 % vs 12 %)**, donc ce n'est pas un artefact de cohorte.

Les prédicteurs **propres** (mesurés sur la seule année 1) :

| Signal année 1 | Retour | vs | Robustesse |
|---|---|---|---|
| ≥ 2 activités | 64 % (n=14) | 25 % | indicatif (petit n) |
| Vraie classe (séance ≥ 10 él.) | 38 % (n=55) | 22 % | seuil métier ≥10 validé |
| ≥ 2 séances | 40 % | 20 % | p=0,045 |
| Entrée en milieu d'année (déc-fév) | 53 % | 27 % (fin d'année) | robuste intra-cohorte |

Le flag le plus actionnable est **négatif** : un prof « one-shot » (1 séance) revient à **20 %**.

> ⚠️ **Correction méthodologique importante.** Le signal « a testé l'outil » (45 % vs 23 %) a été **écarté** : `n_tests` est un compteur de carrière, pas une mesure d'année 1 (sa moyenne passe de 0,5 à 2,9 entre profs à 1 an et à 2 ans). Les profs qui reviennent accumulent des tests *parce qu'ils enseignent une 2ᵉ année* — c'est circulaire.

### Le timing : les essais de fin d'année sont le moteur du décrochage

Entrer tard prédit le décrochage : milieu d'année (déc-fév) **53 %** vs fin d'année (mars-juin) **27 %**, juin étant le plus bas (**14 %**). Au sein de la cohorte 2024-25, l'avantage « avant mars » atteint la significativité (47,6 % vs 20,3 %, p=0,023). Une partie de l'effet est de la **dose** (les entrants précoces touchent plus d'élèves) — les deux sont entrelacés.

### Les profs durables sont « faits », pas « nés »

Parmi les 32 pluriannuels : **25/32** ont eu un démarrage modeste (<5 séances en année 1), **20/32** ont agrandi leur classe en année 2, **15/32** ont ajouté une nouvelle activité. Quatre pionniers explosent de 1-10 séances (an 1) à 16-44 (an 2). **L'intensité est un résultat du fait de rester, pas une condition d'entrée.** Implication : ne pas pré-sélectionner les profs « intenses » — nourrir les entrants modestes qui montrent une 2ᵉ séance.

### Ce qui ne joue PAS (deux espoirs qui tombent)

- **La masse critique locale est un vrai nul.** Solo 31 % vs multi-prof 30 % (sens inverse, p=0,87). Mettre plus de collègues dans l'établissement ne retient pas. *(L'ancienne note misait sur le collectif intra-établissement ; les données l'infirment.)*
- **L'« effet formation » est un artefact de composition.** L'écart formé/non-formé (54 % vs 27 %) **s'explique entièrement** par le fait que les établissements formés contiennent plus de pionniers/fidèles (61,5 % vs 29,5 %). À profil égal, les formés reviennent même **légèrement moins** (87,5 % vs 92,3 %). Il ne faut pas créditer la formation d'une rétention qu'elle n'a pas produite. *(Repose sur 13 profs éligibles dans 8 établissements — données trop minces pour conclure dans un sens ou l'autre.)*
- **L'activité d'entrée est une histoire de portée, pas d'activité.** Les entrants « Statistiques » reviennent plus (43 % vs 30 % pour « Intro IA »), mais ce n'est pas significatif (p=0,29) et l'écart s'effondre dès qu'on contrôle la portée de l'année 1 (Stats = 26 élèves médians vs 11 pour Intro IA). « Intro IA » est une rampe d'accès à faible enjeu ; « Statistiques » un déploiement classe entière — le canal, c'est la portée.

### Géographie / animation

**Lille** est la plus grande académie (45 profs) **et** la meilleure en rétention : 52 % (12/23) vs 24 % ailleurs (p=0,02). Mais une vérification poussée montre que c'est un **pur effet de composition, pas un effet de lieu** : la cohorte éligible de Lille contient simplement plus de pionniers/fidèles (57 % vs 27 % ailleurs), et **à profil égal il ne reste aucun écart Lille** (un contrefactuel « mix seul » reproduit exactement l'écart). Lille est distinct sur la formation (47 % de profs en établissement formé vs 19 % ailleurs), mais la formation ne pilote pas la rétention. À ne **pas** lire comme « l'animation régionale fait revenir ».

---

## IV. Les croisements, classés

1. **La dose de l'année 1 bat toutes les étiquettes** : ≥2 séances + un test → 62 % vs 19 % (one-shot), gap robuste intra-cohorte. Seul moteur non circulaire, transverse à tous les profils.
2. **Le paradoxe du déployeur** : atteindre une classe complète (>20) n'empêche pas 0/41 de décrocher. Premier contact ≠ rétention.
3. **La formation est un artefact de composition, pas une cause** : ne pas lui créditer +26 pts qu'elle n'a pas produits.
4. **La portée, pas le choix d'activité**, explique l'avantage « Statistiques ».
5. **Timing et dose sont entrelacés** : les one-shot de fin d'année (juin 14 %) sont le moteur clair du décrochage.
6. **La masse critique locale est un nul confirmé** ; l'avantage de Lille est un **artefact de composition** (plus de pionniers/fidèles), pas un effet de lieu.
7. **Atteindre la classe est facile pour les profs venus seuls** ; le maillon faible est la **conversion post-formation** (réservoir de profs en exercice à activer), pas le type d'établissement.

---

## V. Recommandations (chacune adossée à une preuve)

1. **Convertir les déployeurs (cible n°1).** 105 profs atteignent une vraie classe puis disparaissent (0/41 reviennent). Une relance de rentrée ciblée — « vous aviez déployé X l'an dernier, voici la suite pour la même classe/le niveau au-dessus » — attaque exactement le point de rupture (réengagement), pas le premier contact.
2. **Pousser la dose dès l'année 1.** Les leviers qui bougent la rétention : une 2ᵉ séance (40 % vs 20 %), une vraie classe ≥10 él. plutôt qu'un survol (38 % vs 22 %), une 2ᵉ activité (64 % vs 25 %). Concevoir l'onboarding pour amener une seconde séance et un déploiement classe entière, pas un essai isolé.
3. **Capter tôt dans l'année.** Les entrées de fin d'année (mars-juin, surtout juin 14 %) décrochent. Un cycle de promotion en septembre-décembre vaut mieux qu'un push de fin d'année.
4. **Nourrir les entrants modestes, ne pas pré-trier les « intenses ».** Les durables sont faits, pas nés (25/32 ont démarré <5 séances). Le signal à suivre est « a fait une 2ᵉ séance », pas « a fait beaucoup d'emblée ».
5. **Ne pas surinvestir le collectif intra-établissement ni créditer la formation/le territoire d'une rétention non prouvée.** L'avantage apparent de Lille n'est qu'un effet de composition. Réorienter vers la **conversion individuelle des déployeurs** (le seul levier robuste).

---

## VI. Ce que cette enquête corrige

**Vs l'ancienne note (nov. 2025) :**
- « 8 élèves de moyenne » = artefact de **grain séance** (médiane séance 5) ; au grain prof la classe médiane est **20**.
- « Le collectif intra-établissement est l'avenir » → **nul confirmé**.
- Rétention « impossible à établir » → **31 % proprement mesuré** (sur cohorte éligible).

**Au sein de l'enquête elle-même** (vérification adversariale) :
- Rétention mesurée sur les **101 profs ayant déjà eu une année suivante** (entrés ≤ 2024-25), pas sur les 224.
- Tautologie profil→retour signalée ; bascule vers des prédicteurs **année-1 propres**.
- Signal « test » écarté (compteur de carrière, circulaire).
- « Effet formation » requalifié en **artefact de composition**.
- Avantage « Statistiques » requalifié en **effet de portée**.

---

## VII. Limites & méthode

- **Pont individuel ténu** : 46 paires amont↔aval fiables ; l'amont (2 715) et l'aval (224) restent deux photographies, pas un parcours individuel reconstitué pour tous.
- **Petits n** : plusieurs cellules (≥2 activités n=14, formés n=13, déc-fév n=19) sont **indicatives** ; rien d'important ne repose sur n<10.
- **Associations bivariées**, pas un modèle ajusté ; les mesures d'intensité sont corrélées entre elles.
- **Anonymat Capytale** : comportements inférés des logs ; la rétention suppose des identifiants de compte stables d'une année sur l'autre. Fenêtre : 2023-24 → 2025-26 (3 années scolaires ; le retour n'est observable que pour les profs des deux premières).
- **Reproductibilité** : `commons/build_master.py` (table maître), `commons/workflow_typologie.js` (enquête 10 questions + vérification), faits dans `commons/data/facts_typologie.json` & `facts_investigation.json` (PII-free).

---

**Sources de vérité** : `commons/data/master_teachers.csv` (pseudonymisé), `facts_typologie.json`, `facts_investigation.json`. Graphiques : `commons/charts/`. Page web : `commons/dashboard_typologie.html`.
