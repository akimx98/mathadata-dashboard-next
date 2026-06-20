# Typologie des profils d'usage MathAData (juin 2026)
## Refonte data-driven de la sociologie des usages

**Date** : 20 juin 2026
**Corpus** : 2 715 comptes site (amont, nominatif) · 401 comptes Capytale engagés dont 224 ont enseigné (aval, anonyme) · 5 854 élèves distincts touchés
**Période** : déc. 2023 → juin 2026 (Capytale) · ouverture des comptes site jusqu'à juin 2026
**Méthode** : segmentation k-means (k=5, silhouette 0,31) relabellisée en archétypes par règles transparentes, croisée avec le parcours amont.

> Cette note prolonge et **corrige** [`ANALYSE_PATTERNS_USAGE.md`](../../ANALYSE_PATTERNS_USAGE.md) (4 nov. 2025, 114 profs, données Capytale partielles). Trois choses ont changé : (1) le corpus Capytale est complet (224 profs ayant enseigné, pas 92) ; (2) on voit enfin la **rétention pluriannuelle** ; (3) on dispose de l'**amont nominatif** (site + type de formation). Là où l'ancienne note spéculait, on mesure.

---

## Ce que les données complètes invalident dans l'ancienne note

| Affirmation de nov. 2025 | Verdict juin 2026 |
|---|---|
| « Taille de classe moyenne : 8 élèves » → mystère central | **Artefact de données partielles.** Médiane réelle = **20 élèves**, moyenne 27. Les petits effectifs existent mais ne concernent qu'**un profil sur cinq** (21 % des profs, 3 % des élèves). |
| « 53 % confiants / 39 % prudents / 19 % explorateurs » | Tendance confirmée mais recalée : **59 % enseignent sans test préalable**, 23 % testent d'abord, 17 % testent après avoir enseigné. |
| Six profils construits à la main | **Cinq archétypes** émergent d'un clustering, et se recoupent largement — mais leurs poids changent (le « dormant » à 30 % était un artefact de la fenêtre d'observation courte). |
| Rétention « impossible à établir » | Désormais mesurée : **30 % de rétention année→année**, cohorte 25-26 **nouvelle à 83 %**. |

---

## I. Le parcours en entonnoir : où sont les gens

Avant de typer les enseignants actifs, il faut situer la population. Le parcours va de la notoriété (compte site) jusqu'à la classe (Capytale), et il fuit massivement à chaque étape.

**Amont — 2 715 comptes site** (nominatif, mathadata.fr) se répartissent en cinq segments :

| Segment | n | % | Lecture |
|---|---|---|---|
| A cliqué vers Capytale | 337 | 12 % | A franchi le pont vers la pratique. Le seul segment « chaud ». |
| Explorateur ressources | 271 | 10 % | Consulte modules/ressources sans (encore) aller sur Capytale. |
| Visiteur léger | 195 | 7 % | S'est connecté, a regardé, sans approfondir. |
| Newsletter seul | 1 003 | 37 % | Inscrit à la lettre, jamais vraiment entré dans le site. |
| Dormant | 909 | 34 % | Compte créé, aucune activité de suivi. |

**71 % des comptes site sont froids** (newsletter-seul + dormant). C'est le vrai réservoir, mais c'est aussi le signe que la création de compte est un engagement très faible : elle ne présage pas de l'usage.

**Aval — 401 comptes Capytale engagés** se répartissent en trois couches :
- **224 ont enseigné** à leurs propres élèves (l'objet de la typologie ci-dessous) ;
- **37 testeurs/distributeurs** ont manipulé une activité sans cohorte d'élèves réelle ;
- **140 stagiaires-seuls** n'apparaissent qu'en formation (compte rôle « élève » dans un atelier), jamais devant leur classe.

> ⚠️ Le pont individuel amont↔aval n'est fiable que pour **46 paires** (appariement inféré, volet 2). On ne peut donc pas coller un type de formation sur chacun des 224 profs : l'effet formation se lit au grain établissement/cohorte (volet 2), pas prof par prof.

---

## II. Cinq archétypes d'enseignants actifs (les 224)

Le clustering sépare les profs sur quatre axes : **intensité** (séances, élèves), **étalement dans le temps** (mono- vs pluriannuel), **largeur** (une activité vs plusieurs), **taille des groupes**. Cinq profils en sortent.

| Archétype | n | % | Élèves¹ | Élèves médian/prof | Séances méd. | % testent | % pluriannuel |
|---|---|---|---|---|---|---|---|
| 🔴 **Pionniers intensifs** | 38 | 17 % | 2 406 | 54 | 6 | 55 % | 50 % |
| 🟢 **Fidèles pluriannuels** | 13 | 6 % | 474 | 33 | 3 | 38 % | 100 % |
| 🔵 **Explorateurs multi-activités** | 20 | 9 % | 534 | 24 | 3 | 45 % | 0 % |
| 🟠 **Déployeurs classe-entière** | 105 | 47 % | 2 384 | 20 | 1 | 40 % | 0 % |
| ⚪ **Petits groupes / usage léger** | 48 | 21 % | 172 | 4 | 1 | 29 % | 0 % |

<sub>¹ Somme des élèves uniques par prof (un élève vu par deux profs compte deux fois) ; le total distinct global est 5 854.</sub>

**La concentration est le fait majeur.** Les 38 pionniers (17 % des profs) touchent autant d'élèves que les 105 déployeurs (47 %) : ~2 400 chacun. À l'autre bout, les 48 « petits groupes » (21 % des profs) ne touchent que 172 élèves (3 %). **L'impact n'est pas réparti uniformément — il repose sur une avant-garde.**

### 🔴 Pionniers intensifs (17 %)
6+ séances, souvent 2 activités, testent puis déploient, et **un sur deux revient l'année suivante**. Ce sont les power users : MathAData est une brique stable de leur enseignement. Ils concentrent l'impact et sont les candidats ambassadeurs/formateurs naturels. *L'ancienne note les estimait à 8 % ; ils sont deux fois plus nombreux dans le corpus complet.*

### 🟢 Fidèles pluriannuels (6 %)
Moins intenses sur une année donnée, mais **100 % reviennent d'une année sur l'autre**. C'est la pérennité sans l'intensité — l'intégration tranquille dans la progression annuelle. Petit groupe, mais le plus précieux pour la durabilité.

### 🔵 Explorateurs multi-activités (9 %)
Deux activités ou plus dès la première année, mais ne reviennent pas (encore). Curieux, balaient le catalogue ; le risque est qu'ils s'éparpillent sans s'installer. Cible de relance year-2.

### 🟠 Déployeurs classe-entière (47 %)
**Le gros du peloton.** Une activité, ~20 élèves (une vraie classe), 1 séance, une seule année. Usage opportuniste branché sur un chapitre précis. Ni test ni reprise : ils prennent l'activité « clé en main ». La question décisive les concernant : reviendront-ils ? (Aujourd'hui, non — voir §III.)

### ⚪ Petits groupes / usage léger (21 %)
~4 élèves, 1 séance. C'est ici — et seulement ici — que vit le « mystère des 8 élèves » de l'ancienne note : soutien, demi-groupe, club, ou simple essai en conditions réduites. Faible empreinte élève (3 %). Soit un usage de niche assumé, soit un déploiement avorté qui n'a jamais atteint la classe entière.

---

## III. La rétention : croissance réelle, fuite massive

C'est l'apport le plus net des données complètes. En croisant qui a enseigné en 2024-25 et en 2025-26 :

| | Enseigné 25-26 | Pas enseigné 25-26 |
|---|---|---|
| **Enseigné 24-25** | 26 (fidèles) | 62 (décrochés) |
| **Pas enseigné 24-25** | 125 (nouveaux) | 11 (anciens 23-24) |

Deux chiffres :
- **Rétention année→année = 30 %** : sur 88 profs actifs en 24-25, seuls 26 reviennent en 25-26. Les deux tiers décrochent.
- **La cohorte 25-26 est nouvelle à 83 %** : 125 des 151 profs actifs cette année n'enseignaient pas l'an dernier.

**Le dispositif croît par acquisition, pas par fidélisation.** Chaque année amène une vague de nouveaux déployeurs, mais la majorité ne revient pas. C'est cohérent avec le poids du profil « déployeur classe-entière » (mono-année par définition) et avec le faible cœur « fidèle » (6 %). Transformer des déployeurs en fidèles est le levier de croissance le plus rentable : on convertit un usage déjà acquis plutôt que d'en recruter un nouveau.

---

## IV. Style d'adoption : confiance plutôt que prudence

Parmi les 224 : **133 (59 %) enseignent sans aucun test préalable**, 52 (23 %) testent puis enseignent, 39 (17 %) testent *après* avoir enseigné (vérification a posteriori). Le déploiement direct domine, ce qui plaide pour des activités « clé en main » robustes : la majorité ne répète pas avant de se lancer. Le test préalable est plus un trait de personnalité professionnelle qu'un prédicteur de réussite — il ne corrèle ni avec la taille de classe, ni avec la rétention.

---

## V. Recommandations différenciées

1. **Cultiver les pionniers (17 %, 40 % de l'impact).** Les documenter (études de cas), les mettre en réseau, leur ouvrir des activités avancées. Ce sont les ambassadeurs et formateurs naturels.
2. **Convertir les déployeurs en fidèles.** C'est le levier #1 de croissance : 105 profs prennent une activité une fois et disparaissent. Une relance de rentrée ciblée (« vous aviez utilisé X l'an dernier, voici la suite ») attaque directement la rétention de 30 %.
3. **Relancer les explorateurs en year-2.** Curieux mais volatils : un parcours progressif leur donne une raison de revenir.
4. **Qualifier les « petits groupes ».** Distinguer le soutien assumé (à outiller) du déploiement avorté (à débloquer par la formation à la classe entière).
5. **Ne pas surinvestir l'amont froid.** 71 % des comptes site sont dormants/newsletter : le compte n'est pas un engagement. L'effort marginal est mieux placé sur la conversion clic→classe (le segment « a cliqué vers Capytale », 12 %) que sur l'acquisition de comptes supplémentaires.

---

## VI. Limites

- **Pont individuel ténu** : 46 paires amont↔aval fiables. La typologie aval (224) et la segmentation amont (2 715) sont deux photographies complémentaires, pas un parcours individuel reconstitué pour tous.
- **Archétypes ≠ frontières étanches** : idéaux-types issus d'un k-means (silhouette 0,31, structure réelle mais souple). Les seuils de relabellisation sont documentés dans `commons/data/` et reproductibles.
- **Anonymat Capytale** : les comportements sont inférés des logs (séances reconstruites), sans accès à l'intention. La rétention pluriannuelle dépend de la stabilité des identifiants de compte d'une année sur l'autre.
- **« Élèves » au grain prof** : la somme par archétype (5 970) surcompte les élèves vus par plusieurs profs ; le distinct global reste 5 854.

---

**Sources de vérité** : `commons/data/facts_typologie.json`, `commons/data/teachers_typologie.csv` (pseudonymisé). Pipeline : clustering sur `volet1/data/teachers.csv` + segmentation amont sur le snapshot Payload (local, gitignore). Graphiques : `commons/charts/`.
