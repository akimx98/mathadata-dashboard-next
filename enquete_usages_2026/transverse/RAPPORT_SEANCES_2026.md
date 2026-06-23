# Anatomie d'une séance MathAData
## Comment l'outil se vit réellement en classe — scénarios, rythmes, cas

**Date** : 20 juin 2026
**Corpus** : 738 séances reconstruites · 224 professeurs · 5 854 élèves distincts (6 810 participations)
**Méthode** : reconstruction des séances depuis les logs Capytale (horaires, durées, groupes), enrichie des signaux élève (reprises, travail-maison, durée de travail), inspirée de `export_csv_by_teacher.js`. 14 questions investiguées par agents puis **vérifiées de façon adversariale** (circularité, confusions, petits effectifs).

> **Note de cadrage.** Ce rapport (« la séance ») est le pendant de [`TYPOLOGIE_PROFILS_2026.md`](TYPOLOGIE_PROFILS_2026.md) (« le prof »). Là, *qui* enseigne et *qui revient* ; ici, *comment* une séance se déroule. Une **séance** est un *cluster reconstruit d'activité élève*, pas forcément un cours complet : la durée médiane d'un cluster est ~7 min (25ᵉ pct = 0). Les durées décrivent donc des **salves d'activité**, pas la durée réelle d'un cours.

> **Réconciliation glossaire (2026-06-23).** Définitions alignées sur [`GLOSSAIRE.md`](GLOSSAIRE.md). Ce rapport traite la **mécanique** des séances ; l'origine (**canal** `via_site`/`capytale_direct`) et la **formation** (timée) sont traitées dans les rapports Usage-Capytale / Site-vers-classe. Rappels : **usage-classe** = ≥ 5 él. ; **séance riche / classe entière** = ≥ 10 él. (mode-cible) ; **réutilisation** = intra-annuelle stricte ; **retour** = entre années (consécutif vs réactivation).

---

## En bref

- **Quand ?** Massivement le **matin en semaine** (45 % des séances ; pics mardi/jeudi/lundi). Soir 8,5 %, week-end 8,5 % — et cette charge hors-heures est portée **aux deux tiers par les pionniers**.
- **Comment ?** Six modes d'usage peuplés. Trois sont des **impasses** (one-shot, déploiement classe entière, ponctuel petit groupe — **0 % de retour**), trois sont **durables** (marathon, soutien récurrent, demi-groupe — mais leurs taux sont en partie circulaires, voir §II).
- **Le « petit groupe » recouvre deux mondes opposés** : le **soutien récurrent** (durable, 60 % de retour) vs l'**essai ponctuel** (abandonné, 0 %) — Fisher p=0,0007.
- **Largeur, pas profondeur** : 58 % des profs touchent plusieurs classes, mais en *répliquant* (≈ une séance par groupe) ; approfondir une même classe est quasi inexistant (4 profs mono-classe sur 95 ont fait une 2ᵉ séance).
- **L'élève travaille ~30 min dans une vraie séance, mais 6 min chez les « petits groupes »** — un signal de profondeur, pas de simple taille.

---

## I. Quand ? Le rythme des séances

Sur 738 séances : **45,5 % le matin**, 29,1 % l'après-midi, 14,1 % le midi, **8,5 % le soir**, 2,7 % avant 8 h. Jours les plus chargés : **mardi 23 %, jeudi 19 %, lundi 17 %** ; seulement 8,5 % le week-end. C'est une activité de cours, calée sur l'emploi du temps.

Mais le **hors-heures est une signature de pionnier**. Leur taux de séances le soir est **11,6 % vs 5,0 %** pour les déployeurs, et le week-end **13,7 % vs 4,5 %** ; ils concentrent **70 % de toutes les séances du soir et 83 % de celles du week-end**. *(Caveat : les pionniers font 51 % de toutes les séances, donc une part de cette domination est un effet de volume ; le taux — 11,6 % vs 5,0 % — est la statistique propre.)*

Par scénario, les rythmes se séparent nettement :
- **Déploiement classe entière** = le cours du matin (49,6 % le matin, ~15 élèves, salve ~11 min, quasi rien hors-heures).
- **Soutien récurrent** = le mode hors-heures / autonome (2 élèves, le plus de soir 16 % et de week-end 18,5 %, salves les plus courtes ~2,5 min).

---

## II. Galerie des scénarios

Sept scénarios définis, **six peuplés** (intensif court = 0). Ils se rangent en deux familles.

| Scénario | n profs | Définition | Durabilité (retour) |
|---|---|---|---|
| 🟢 **Marathon** | 26 | usage étalé sur 120+ jours (médiane 354 j) | 100 % — **circulaire** ⚠️ |
| 🟢 **Soutien récurrent** | 14 | créneau fixe récurrent, plus petits groupes, long étalement | 60 % (6/10, **indicatif**) |
| 🔵 **Demi-groupe** | 10 | paires de séances le même jour (classe dédoublée) | 3/4 (**n<10, indicatif**) |
| 🔴 **One-shot** | 91 | une seule séance, puis plus rien | **0 %** (0/36) |
| 🔴 **Déploiement classe entière** | 44 | une quasi-classe sur une semaine, sans suite | **0 %** (0/12) |
| 🔴 **Ponctuel petit groupe** | 39 | un petit groupe touché 1-2 fois | **0 %** (0/17) |

**Le résultat robuste est le contraste des impasses** : les trois modes « dead-end » rendent **0 %** uniformément — et c'est *non circulaire* (un one-shot a un étalement de 0 jour, « revenir l'année suivante » est donc une mesure réellement indépendante).

⚠️ **Les taux du côté durable sont en partie circulaires** et ne doivent **pas** être lus comme des effets : « marathon » = s'étaler sur 120+ jours, ce qui *signifie mécaniquement* enseigner sur 2 années — soit la définition même de « revenir ». À ne citer que comme la *forme* du durable, pas comme un levier.

**Le vrai enseignement non circulaire** : parmi les usages en **petit groupe**, le **soutien récurrent** (60 % de retour) écrase l'**essai ponctuel** (0 %), Fisher p=0,0007. Même taille de groupe, destin opposé — la différence est la **récurrence**, pas l'effectif.

---

## III. Deux mondes du « petit groupe »

« Petit groupe » ne veut pas dire une chose. Il se scinde :

| | Soutien récurrent (n=14) | Ponctuel (n=39) |
|---|---|---|
| Étalement médian | **219 jours** | 5 jours |
| Élèves distincts | 38 | 11 |
| Travail / élève | ~30 min | 7 min |
| Retour année suivante | **60 % (6/10)** | 0 % (0/17) |

Et **11 des 14** profs « soutien récurrent » sont des **pionniers**. ⚠️ Mais l'étiquette « cours de soutien hebdomadaire » ne tient pas à la lecture fine : les cas montrent surtout **beaucoup de séances individuelles (n=1) d'une activité-ancre réutilisée**, réparties sur ~6 classes et toutes les heures — c'est du **travail autonome durable**, pas un petit créneau hebdo unique (voir cas T188, §VI).

---

## IV. Anatomie d'une séance & engagement élève

**La séance type est une courte salve.** Médiane ~7 min, 66 % ≤ 15 min, 20 % ≥ 45 min. Beaucoup de « séances » sont en réalité des micro-bursts (un élève qui ouvre, fait un peu) — d'où la prudence sur les durées.

**La durée de travail par élève est un vrai signal de profondeur** (médiane par prof) :

| Archétype | Travail médian / élève |
|---|---|
| Déployeurs | 35 min |
| Pionniers | 31 min |
| Fidèles | 28 min |
| Explorateurs | 20 min |
| **Petits groupes** | **6 min** |

Chez les « petits groupes », l'élève travaille **6 min** et **75 % de ces profs n'ont aucun élève dépassant 60 min** : ce ne sont pas seulement de petites séances, ce sont des **survols**. ⚠️ Mixture toutefois : 42 % des profs « petits groupes » sont à 0 min, l'autre moitié à ~30 min.

**Reprises et travail-maison existent mais ne sont pas des leviers.** 13 % des participations-élèves sont des reprises (l'élève revient ≥12 h plus tard), 10 % ont lieu le soir/week-end. Cela *semble* prédire le retour (47 % vs 11 %)… mais c'est **entièrement confondu** : le signal disparaît une fois l'intensité contrôlée — c'est un **proxy d'être pionnier/fidèle**, pas une cause. À présenter comme une *texture d'engagement*, pas un prédicteur.

---

## V. Profondeur ou largeur ?

**58 % des profs touchent ≥2 classes** (médiane 2 ; pionniers **6**). Mais c'est de la **réplication** (≈ une séance par groupe), pas de l'**approfondissement** : seuls **4 profs mono-classe sur 95** ont fait une 2ᵉ séance avec la même classe. Et le gradient « plus de classes → plus de retour » (0 % → 28 % → 29 % → 72 %) est un **effet de volume / pluriannuel** : chez les multi-classes, le retour est entièrement expliqué par le fait d'avoir enseigné ≥2 ans (0/69 à 1 an, 31/32 à 2+ ans). À lire comme une *description du comment*, pas comme une preuve que la largeur cause la durabilité.

---

## VI. Galerie de cas (anonymisés)

### T186 — non pas un champion, mais le hub fondateur du réseau pilote
⚠️ **Mise en cohérence avec le [Volet 1](../usage-capytale/RAPPORT_ENQUETE_USAGES.md) (§6) et le [Volet 2](../site-vers-classe/RAPPORT_VOLET2.md) (§12).** Le compte n°1 par nombre d'élèves (404, identifiant séquentiel « 0 ») n'est **pas un professeur local hyperactif** : ses 48 séances sont **réparties sur 14 établissements** (Haubourdin, Lille, Orsay, Toulouse, **Papeete**, Calais…), avec **seulement 56 élèves à Haubourdin**. C'est le **compte-maître du réseau pilote** (le fondateur), qui clone l'activité dans des classes hôtes lors d'animations. Sa « trajectoire » (an 1 prudent → an 2 explosion → an 3 diversifié sur 7 activités) raconte donc le **déploiement du pilote sur le territoire**, pas l'apprentissage d'un enseignant. Le Volet 2 l'**isole** comme nœud historique ; au grain prof il fausse les classements (à retraiter à part). On le garde ici comme **phénomène** — la signature d'un essaimage piloté — pas comme modèle à reproduire.

### T187 — le vrai power-user organique : déployer fort dès la première année
Lycée Vaclav Havel, **Bègles** (Bordeaux). Le plus gros porteur **non-pionnier** du dispositif : **140 élèves dès sa première année** (printemps 2026), 7 séances d'une seule activité, classes de **46, 26, 26, 25** élèves — un mélange de classe entière et de demi-groupes déployés en deux mois. Aucun test préalable, aucun historique : un nouvel entrant peut **déployer à grande échelle immédiatement** (cf. Volet 1, §6 et l'étude de cas Bègles). C'est le pendant « organique » du hub : l'impact n'a pas besoin de trois ans ni d'un réseau — il peut surgir d'un seul prof décidé, en une saison. *(Reste mono-activité et mono-année à ce stade : la question ouverte est s'il reviendra et diversifiera — cf. déterminants de la durabilité, §05.)*

### T005 & T012 — le paradoxe « atteint puis disparu »
**T005** (Toulouse) : 3 séances, **toutes la même activité** « Intro IA » — lun. 19 mai 16 h (19 élèves, 52 min), un fragment 2 élèves le même jour, ven. 23 mai 10 h (**41 élèves**, 28 min). 42 élèves sur 4 jours, une activité, **jamais revenu**. **T012** (Pantin) : un one-shot plus riche — lun. 31 mars 14 h, **36 élèves**, 92 min, continuation 28 % — un vrai cours complet, fait une fois, **jamais répété**. **Le motif d'archétype** : les **41 déployeurs éligibles décrochent tous (0/41)**, chacun n'a utilisé **qu'une seule activité** — contre **90 % de retour (27/30)** chez ceux qui ont atteint une **séance riche / classe entière (≥ 10 él.)** *avec* 2+ activités et ~5 séances. **La portée n'est pas le tueur ; la portée *peu profonde* l'est.** (Fisher p≈2e-11 sur le contraste classe-entière.) *(Note : ce contraste isole la **profondeur** — 1 vs 2+ activités —, pas la **taille** : élargi à toutes les grandes classes (≥ 20 él.), le retour est de **47 % (16/34)**. La largeur seule ne tue pas le retour ; la **profondeur faible** oui.)*

### T188 — le pionnier durable : du travail autonome, pas un cours hebdo
Terminale. Corrige l'étiquette « petit groupe hebdomadaire ». Une activité dominante (« Droite & produit scalaire », 43 séances sur 47) utilisée en **travail individuel autonome**, activité-ancre conservée d'une année sur l'autre (avr. 2025 et avr. 2026 — = **retour consécutif**, glossaire §5 ; la *réutilisation* au sens strict est intra-annuelle). **27 des 47 séances sont à 1 élève**, réparties sur les 7 jours et toutes les heures — la signature d'élèves revenant seuls sur une activité-ancre. Continuation 53 %, 46 élèves en reprise, revenu. (Jumeau T190 : 47 séances, 475 j, continuation 84 %, 106 reprises.)

### T137 & T135 — la cadence des fidèles : durable sur 3-4 touches/an
**T137** (Amiens) : 4 séances en 378 jours, une seule activité, tout le matin — un « taste test » de fin d'année **répété les deux ans**, 13 élèves, travail quasi nul. **T135** (Lille) : 3 séances en 347 jours mais ancrées sur du vrai cours (un cours de 93 min), revenant à la **même activité** dans la même fenêtre février/mars l'année suivante. **Même durabilité, intensité opposée** : l'archétype « fidèle » se définit par la *cadence de retour*, pas par le volume. *(⚠️ fidèle est défini par n_sy_taught=2 : 13/13 reviennent par définition ; la découverte est la haute durabilité à très faible volume annuel.)*

---

## VII. Limites & méthode

- **Une « séance » est reconstruite** (cluster d'activité élève) : médiane ~7 min, durées = salves, pas des cours.
- **Circularité signalée** : marathon/fidèle (étalement = pluriannuel = retour) ; soutien partiellement (créneau fixe = définition). Les résultats portants sont les **0 % des impasses**, le contraste **soutien vs ponctuel**, les **durées de travail** et les **rythmes hors-heures**.
- **Confusions signalées** : reprise/travail-maison, gradient multi-classe, et la moitié rétention de la durée de travail sont des **proxys de l'intensité/pluriannualité**, pas des leviers indépendants.
- **Petits effectifs** : soutien (n=14), demi-groupe (n=10, **effectif réduit pour l'inférence**, n<30 — résultats indicatifs), fidèle (n=13) — **indicatifs**. Cas individuels = n=1, descriptifs, anonymes (pseudonymes ; commune/académie = grain établissement).
- **Reproductibilité** : `transverse/build_scenarios.py` (table séances) → `transverse/workflow_scenarios.js` (14 questions + vérif) → charts. Faits : `transverse/data/facts_scenarios.json`, `scenarios_teachers.csv`, `sessions_enriched.csv` (pseudonymisés, PII-free).

---

**Sources de vérité** : `transverse/data/scenarios_teachers.csv`, `sessions_enriched.csv`, `facts_scenarios.json`. Graphiques : `transverse/charts/sea_*.png`. Page web : `transverse/dashboard_seances.html`.
