# Enquête sur les usages de MathAData
### Ce que les données Capytale révèlent du déploiement réel en classe

> **Données** : extraction Capytale du **19 juin 2026** — 7 353 affectations, **261 professeurs**, **5 854 élèves uniques**, **12 activités**, **182 établissements localisés**, **24 académies**, **52 départements**. Période : décembre 2023 → juin 2026.
> **Méthode et définitions** : [DEFINITIONS.md](DEFINITIONS.md). Tous les chiffres proviennent de `data/facts.json`, recalculés et **vérifiés par trois recomputations indépendantes** (voir §11). Pipeline reproductible : `build_canonical.py` → `compute_facts.py` → `make_charts.py`.

---

## 0. Synthèse en une page

En 2025-2026, MathAData a franchi le seuil qui sépare une **expérimentation pilote** d'un **outil diffusé nationalement**. Le volume d'usages élèves a **plus que doublé** (2 181 → 4 479, **+105 %**) *alors même que l'année scolaire n'était pas terminée* à l'extraction. Quatre vérités structurantes ressortent des données :

1. **C'est un outil de lycée, public, de seconde.** 97 % des professeurs enseignent en lycée, **98 % dans le public**, et l'essentiel du catalogue cible la 2nde. Le collège est quasi absent (7 professeurs). Le contenu fait le public.

2. **L'adoption est directe et solitaire.** Les **deux tiers** des professeurs donnent l'activité à leurs élèves *sans trace de test préalable*, et **80 % des établissements n'ont qu'un seul professeur utilisateur**. MathAData se diffuse pour l'instant prof par prof, peu par contagion entre collègues.

3. **La croissance est extensive, pas intensive.** **83 % des professeurs qui enseignent en 2025-2026 sont entièrement nouveaux**, et ils génèrent **74 % du volume** de l'année. L'effet net des professeurs déjà présents est quasi nul. La machine à *recruter* fonctionne ; la machine à *faire revenir* est à construire (rétention inter-annuelle de **30 %**).

4. **Le moteur du contenu, ce sont les statistiques et la géométrie « programme ».** La croissance 2025-2026 est portée par les statistiques (+1 340 usages) et la géométrie analytique (+1 236), tandis que l'activité historique « Intro à l'IA » **recule** (−485). MathAData réussit sa mue d'un gadget « IA » vers un outil arrimé au programme de seconde.

Le défi n'est donc pas d'attirer — c'est de **transformer l'essai** : faire revenir les professeurs d'une année sur l'autre, et faire passer un second collègue à l'acte dans les 80 % d'établissements encore mono-utilisateurs.

---

## 1. Le portrait-robot de l'usage

### 1.1 Un outil de lycée, de seconde, public

MathAData, présenté comme un TP numérique « collège **et** lycée », est en pratique **un outil de lycée**.

| Type d'établissement | Professeurs | Élèves (usages) |
|---|---:|---:|
| **Lycée** | **219 (97 %)** | 5 335 |
| Collège | 7 (3 %) | 69 |
| UAI inconnu | 35 | 566 |

*(parts sur les 226 professeurs au type connu)*

Le déploiement est en outre **quasi exclusivement public** : **222** professeurs en établissement public contre **4 dans le privé** (sur 226 identifiés). MathAData est un phénomène de l'enseignement public.

La cause est lisible dans le **catalogue** : sur 12 activités, la grande majorité du volume porte sur des contenus **2nde** (statistiques, équations de droite, géométrie repérée), avec une extension récente vers la **1ère** (produit scalaire). Tant que les activités s'ancrent dans le programme de seconde générale, l'usage reste au lycée — et le collège, faute de contenu dédié, reste à la porte.

### 1.2 Trois activités portent les trois quarts de l'usage

| Activité | Niveau | Usages élèves (cumul) |
|---|---|---:|
| Statistiques – classification de chiffres | 2nde | **2 314** |
| Intro à l'IA – chiffres 2 et 7 | 2nde | 1 482 |
| Équation réduite de droite | 2nde | 1 188 |
| Statistiques – santé du fœtus | 2nde | 423 |
| Géométrie repérée (milieu, distance) | 2nde | 402 |
| Droite & produit scalaire | 1ère | 331 |
| Équation cartésienne & vecteur directeur | 2nde | 300 |
| Challenge IA – réseau de neurones | Lycée | 276 |

*(usages élèves seuls, hors tests profs et hors compte de démo)*

Les **trois premières activités = ~73 %** de tous les usages élèves. L'activité historique « Intro à l'IA : chiffres 2 et 7 » reste 2e en cumul, mais elle est **en recul** (§4) : la dynamique est désormais portée par les contenus statistiques et géométriques.

### 1.3 La « classe » type : un demi-groupe de 17 en salle info

En regroupant les clones élèves par professeur, activité et proximité temporelle (fenêtre 3 h), on reconstitue **~700 séances** (738 dans le paramétrage de référence ; 613 si l'on exclut les clones sans établissement — voir §11). Toutes ne sont pas des classes : ~220 séances ne comptent qu'un élève (tests, élèves isolés). Mais **~290 séances réunissent ≥10 élèves**, et leur **taille médiane est de 17** (moyenne 19, quartiles 13–25) — *un résultat stable quelle que soit la méthode de regroupement.*

C'est exactement la signature d'un **TP en salle informatique en demi-groupe** :

- **41,8 %** des classes tombent dans la fourchette **12–18 élèves** (demi-groupe, ~18 postes en salle info) ;
- **25,2 %** dans la fourchette 24–36 (groupe-classe complet).

Le demi-groupe est donc le **mode d'usage dominant**. Par activité, statistiques (médiane 17), Intro IA (16) et équation de droite (15) sont des activités de demi-groupe ; seules « Géométrie repérée » (médiane **25**) et « Droite & produit scalaire » (20) montent vers la classe entière.

---

## 2. Patterns d'usage : tester ou plonger ?

Selon qu'une activité a été clonée comme « test enseignant » (`role=teacher`) avant — ou jamais — d'être donnée aux élèves, on distingue trois trajectoires :

| Trajectoire | Professeurs | Part |
|---|---:|---:|
| **Enseigné sans test préalable** (plongée directe) | **172** | **66 %** |
| **Testé puis enseigné** (la voie « manuel ») | 52 | 20 % |
| **Testé, jamais enseigné** (non converti) | 37 | 14 % |

Résultat contre-intuitif et central : **les deux tiers des professeurs lancent MathAData en classe sans test personnel enregistré**. Parmi les **224 professeurs ayant effectivement enseigné, seuls 52 (23 %)** ont laissé une trace de test avant leur première classe.

> **Précaution de lecture.** « Test » = un clone explicitement `role=teacher`. Un enseignant peut s'approprier une activité (la lire, la projeter, l'essayer via le code qu'il partagera) sans produire ce clone. Le chiffre mêle donc de vraies adoptions « à froid » et une appropriation informelle invisible. Dans les deux cas, le message est le même : **le parcours « test → classe » n'est pas le parcours dominant**. Beaucoup de professeurs font confiance à l'activité — recommandée par un pair, une formation, l'équipe — et la lancent directement.

### 2.1 Quand on teste, on enseigne… le jour même

Pour les 52 professeurs « testé puis enseigné », le délai test → première classe est **très court** :

- **médiane : 2,3 jours** ;
- **38,5 % testent le jour même** de leur première classe ;
- **63,5 % sous 7 jours**, 80,8 % sous 30 jours.

Le « test », quand il a lieu, fonctionne donc comme une **mise en place de séance** (la veille, le jour même) bien plus que comme une longue évaluation préalable. Une petite queue (10 profs) revient enseigner > 30 jours après — parfois **une année scolaire entière** après leur test initial.

### 2.2 La conversion test → classe dépend de l'activité

Quand un professeur *teste* une activité, ira-t-il jusqu'en classe ? Le taux varie fortement :

| Activité | Profs testeurs | Conversion test → classe |
|---|---:|---:|
| Statistiques – classification de chiffres | 46 | **74 %** 🟢 |
| Droite & produit scalaire (1ère) | 11 | 64 % |
| Statistiques – santé du fœtus | 15 | 60 % |
| Intro à l'IA – chiffres 2 et 7 | 42 | 57 % |
| Géométrie repérée (milieu/distance) | 9 | 56 % |
| **Équation réduite de droite** | 39 | **49 %** 🔴 |

L'activité phare (statistiques) **convertit excellemment (74 %)**. À l'inverse, **« Équation réduite de droite » est la moins convertie (49 %)** malgré un grand nombre de testeurs. Interprétation : les activités **signature « IA / données »** apportent une valeur différenciante qui motive le passage en classe, alors que l'équation de droite a un **substitut pédagogique évident** sans MathAData — et se trouve en concurrence avec les autres variantes géométrie (cartésienne, produit scalaire) qui fragmentent les testeurs.

---

## 3. Dynamique locale : un outil encore solitaire

MathAData se diffuse-t-il par contagion entre collègues d'un même établissement ? **Très peu, pour l'instant.**

| Établissements selon le nb de profs utilisateurs | Nombre |
|---|---:|
| **1 seul professeur** | **146 (80 %)** |
| 2 professeurs | 26 |
| 3 professeurs ou plus | 10 (max : **6**, à Calais) |

**Quatre établissements sur cinq reposent sur un professeur unique.** L'adoption est un acte individuel, rarement une décision d'équipe disciplinaire.

Parmi les 36 établissements multi-profs, deux dynamiques :

- **Lancement conjoint** (les collègues démarrent la même année) : **23 (64 %)** — une équipe qui adopte ensemble, souvent sous l'effet d'un déclencheur externe commun (formation, animation académique) ;
- **Diffusion échelonnée** (un pionnier, puis des collègues l'année suivante) : **13 (36 %)** — la vraie « tache d'huile » interne, encore rare.

Deux faits éclairants :

- **Aucun code d'activité n'est partagé entre deux professeurs** (sur 385 codes de distribution) : chaque enseignant crée sa propre distribution. La transmission entre collègues passe par le bouche-à-oreille et la ré-appropriation, jamais par le partage d'un même lien de classe.
- Le **« collègue non convaincu »** (teste mais n'enseigne pas, alors qu'un confrère du même établissement enseigne) est **rare : 8 cas seulement**. Le frein n'est donc pas l'essai non concluant entre collègues — c'est **l'absence d'un second prof tout court**.

### 3.1 Quatre études de cas

- **Lycée Léonard de Vinci, Calais (Lille)** — *diffusion échelonnée, le plus gros foyer collégial.* Un noyau de 3 profs en 2024-2025 (fév-mars 2025) entraîne **3 collègues** en 2025-2026 : **6 professeurs, ~297 élèves, 21 séances**. Cas-école de tache d'huile, devenu **auto-portant sans le pionnier historique**.
- **Lycée Louis Pasteur, Lille** — *diffusion la plus longue.* Un pionnier dès 2023-2024, rejoint par un collègue en 2024-2025, puis deux nouveaux en 2025-2026 : **4 profs, 161 élèves sur 3 ans** — environ un professeur de plus par an.
- **Lycée Vaclav Havel, Bègles (Bordeaux)** — *lancement conjoint le plus intense.* Les **3 profs démarrent tous en 2025-2026**, à quelques jours d'écart (mars-mai 2026), **sans aucun pionnier antérieur** : **283 élèves**, tous en adoption directe. C'est le **plus gros établissement moteur de la période** — à lui seul, il propulse Bordeaux au 3e rang des académies.
- **Lycée de Haubourdin (Lille)** — *la limite de la diffusion.* Le compte pionnier (404 élèves sur 3 ans, en solo) n'a entraîné **qu'un seul collègue**, et tardivement (mai 2026, 27 élèves). Une activité individuelle intense **ne se traduit pas mécaniquement** en diffusion locale.

> La dynamique collégiale est géographiquement **concentrée dans l'académie de Lille** (Calais, Haubourdin, Pasteur, Genech, Hazebrouck, Lambersart, César Baggio…) : c'est là que l'effet « tache d'huile » inter-collègues est le plus visible — héritage du foyer pionnier nordiste.

---

## 4. La croissance 2025-2026 : qui la porte ?

L'année 2025-2026 (incomplète) a déjà **plus que doublé** le volume de 2024-2025.

| Année scolaire | Usages élèves | Tests profs | Profs enseignants |
|---|---:|---:|---:|
| 2023-2024 | 150 | 18 | 21 |
| 2024-2025 | 2 181 | 150 | 88 |
| **2025-2026** *(au 19 juin)* | **4 479** | 180 | **151** |

La trajectoire mensuelle est éloquente : démarrage poussif à l'automne, puis **explosion au printemps** — **mai 2026 culmine à plus de 1 000 usages élèves** dans le mois.

### 4.1 La croissance est tirée par de nouveaux entrants, pas par l'intensification

| | 2024-2025 | 2025-2026 |
|---|---:|---:|
| Professeurs enseignants | 88 | 151 |
| ...dont **nouveaux** (jamais enseigné avant) | — | **123 (81,5 %)** |
| ...récurrents (déjà actifs en 24-25) | — | 26 (rétention **30 %**) |
| Usages élèves générés par les **nouveaux** | — | **3 306 (74 %)** |
| Usages élèves des récurrents | — | 1 173 (26 %) |

Les 123 nouveaux professeurs génèrent à eux seuls **74 % du volume** 2025-2026 et **144 % du delta net** (+2 298). À l'inverse, **l'effet net des professeurs récurrents est quasi nul** : les 26 profs actifs les deux années font 1 065 élèves en 24-25 contre 1 062 en 25-26. Le moteur n'est donc **pas** l'intensification des profs en place, mais l'**acquisition** de nouveaux.

L'intensité progresse tout de même modérément (élèves/prof 24,8 → 29,7 ; séances/prof 2,6 → 3,05), mais les nouveaux profs sont **plus petits** (médiane 20 élèves) que les récurrents (médiane 47,5). Un revers : **62 professeurs de 2024-2025 n'ont pas réenseigné** (~1 116 élèves « perdus ») — en partie un artefact de calendrier (année non finie), en partie un vrai churn.

### 4.2 Ce que la 2e année change dans le mix pédagogique

La croissance n'est pas uniforme. Entre 2024-2025 et 2025-2026, les variations d'usages élèves :

| Thème | Δ usages | | Activité | Δ usages |
|---|---:|---|---|---:|
| **Statistiques** | **+1 340** | | Statistiques – classif. chiffres | +917 |
| **Géométrie** | **+1 236** | | Statistiques – santé fœtus *(nouvelle)* | +423 |
| Challenge IA | +216 | | Géométrie repérée *(nouvelle)* | +398 |
| **IA (intro)** | **−485** | | Équation cartésienne *(nouvelle)* | +300 |
| | | | **Intro IA – chiffres 2 et 7** | **−485** |

Par niveau, **la 2nde concentre +1 884 du delta**, la 1ère +207. Le message : **MathAData réussit sa mue** d'un gadget « IA » (l'activité historique recule de 485) vers un outil **arrimé au programme de 2nde** (statistiques + géométrie analytique), diversifié par de nouvelles activités qui trouvent immédiatement leur public.

### 4.3 Saisonnalité : un outil de printemps

Les classes (≥10 élèves) se concentrent nettement sur la **2e moitié de l'année** :

```
Sep  Oct  Nov  Déc │ Jan  Fév  Mar  Avr  Mai  Jun
  3    4    6   14  │  29   27   51   43   70   47
```

Deux causes se conjuguent : les **chapitres** (statistiques, géométrie analytique) sont traités après les fondamentaux d'automne, et beaucoup de professeurs **découvrent l'outil en cours d'année**. Conséquence opérationnelle : le pic de charge — et la fenêtre d'accompagnement la plus utile — se situe **de mars à juin**.

---

## 5. Les testeurs non convertis : qui reste sur le quai ?

37 professeurs ont testé sans jamais enseigner. Mais ce chiffre brut est trompeur : **23 d'entre eux n'ont testé qu'en 2025-2026** — des testeurs *récents* qui peuvent encore basculer en classe. Les **vrais non-adoptants** (testé en 2024-2025 ou avant, jamais enseigné) ne sont que **14**.

L'hypothèse initiale — « les non-convertis seraient surtout des professeurs de collège » — **est démentie** : les 14 vrais non-adoptants sont **11 lycées, 3 inconnus, 0 collège**, et 100 % public — un profil identique à la base. Le collège est marginal *partout*, pas spécifiquement chez les non-convertis.

Deux enseignements plus fins :

- **Ce ne sont pas des essais bâclés** : les vrais non-adoptants ont une **médiane de 2 tests** (vs 1 pour les convertis), l'un a même testé 7 activités. Ils ont **exploré sérieusement** puis ne sont pas passés à l'acte — c'est un **échec d'activation**, pas un manque d'essai.
- L'activité **« Équation réduite de droite »** y est sur-représentée (testée par 23 des 37 « testé seulement »), cohérent avec son faible taux de conversion (§2.2). C'est l'activité à retravailler en priorité.

---

## 6. Les power users : une concentration modérée

L'usage est-il porté par une poignée de super-utilisateurs ? **Moins qu'on ne le craindrait.**

- Le **top 10 des professeurs** concentre **21 %** des élèves uniques ; le top 20, environ un tiers.
- **Coefficient de Gini** des élèves/prof : **0,49** parmi les professeurs enseignants (0,56 si l'on inclut les 37 testeurs sans élève) — une inégalité réelle mais **loin d'un monopole**.
- Le professeur médian (parmi les enseignants) anime **2 séances** ; seuls **9 professeurs** ont animé 10 séances ou plus.

Le plus gros compte (**404 élèves**, 7 activités, actif les trois années, à **Haubourdin** près de Lille) est un **compte pionnier historique** (identifiant séquentiel « 0 ») : à lire comme le **foyer d'origine** du projet, pas comme une adoption organique ordinaire. Même en l'incluant, la concentration reste modérée — signe d'une base d'usage qui s'est **élargie et déconcentrée** depuis les débuts lillois (cf. §7).

À côté du pionnier, de **vrais power users organiques** émergent : à Bègles, un professeur porte **140 élèves** dès sa première année (le plus gros porteur non-pionnier), preuve qu'un nouvel entrant peut immédiatement déployer à grande échelle.

---

## 7. Trajectoire géographique : du foyer nordiste à la nation

L'histoire géographique se lit en **trois temps** (élèves uniques localisés par année) :

| Année | Élèves localisés | Profs | Académie de tête | Part de tête |
|---|---:|---:|---|---:|
| 2023-2024 | 146 | 21 | Paris / Versailles / Lille *(au coude-à-coude)* | ~16 % |
| 2024-2025 | 1 943 | 88 | **Lille** | **30,4 %** |
| 2025-2026 | 3 783 | 151 | Lille | **20,2 %** |

- **2023-2024 — naissance dispersée.** Quelques têtes de pont (Victor Duruy à Paris, Louis Pasteur à Lille), 21 profs éparpillés.
- **2024-2025 — le foyer Hauts-de-France.** L'académie de Lille pèse **30,4 %** à elle seule (Nord = 24,7 %), portée par une **grappe locale** : Hazebrouck (Lycée des Flandres, 80 élèves, 3 profs), Genech (Charlotte Perriand, 76 él., 3 profs), Dunkerque, Lille Pasteur. Premier gros relais hors Nord : Pierre de Fermat à Toulouse (75 él.).
- **2025-2026 — la nationalisation.** **24 académies**. Lille reste 1ère mais **ne pèse plus que 20,2 %** — non par recul (Lille *gagne* +173 élèves) mais par **dilution** dans une croissance portée ailleurs : **Bordeaux** (+378, via Bègles), **Versailles** (+261), **Nantes** (+213). Émergence de **4 académies nouvelles** (Nice 112, Limoges 90, Dijon 77, Corse 7) et de départements inédits (Creuse, Loire-Atlantique, Côte-d'Or, Var…).

### L'effet pionnier, concentré dans le temps

Le compte « 0 » (Haubourdin) représente **6,9 % du total cumulé**, mais son poids **culmine à 13,4 % des élèves en 2024-2025 puis s'effondre à 3,5 %** en 2025-2026. Dans le Nord, sa part passe de **40 % (2023-24) → 26 % (2024-25) → 0 % (2025-26)** : **le territoire est devenu auto-portant** (relais comme Calais Léonard de Vinci, 227 élèves, 7 profs).

Fait rassurant : **recalculé sans le pionnier**, le pic Hauts-de-France 2024-2025 reste massif (Nord 21,4 %, Lille 27,6 %). L'ancrage nordiste n'est **pas un artefact d'un seul compte** : c'est une vraie grappe locale que le pionnier a amorcée puis qui a essaimé.

> **Le modèle de diffusion qui se dessine : « un gros lycée = un foyer ».** En 2025-2026, **trois lycées** (Bègles 283, Calais 227, Lille Pasteur 125) totalisent ~635 élèves, soit **~17 % du volume annuel**. La croissance se fait par reproduction de ces foyers-établissements, pas par dispersion fine.

---

## 8. Dynamique temporelle : beaucoup d'éphémères, un petit noyau

Combien d'années un professeur reste-t-il à bord ?

| Années scolaires où le prof a enseigné | Professeurs |
|---|---:|
| 1 seule | **192 (86 %)** |
| 2 années | 28 |
| 3 années | 4 |

L'immense majorité n'a (à ce jour) enseigné que **sur une seule année scolaire**. Couplé à la rétention de **30 %** (§4.1), cela dessine un modèle où la base se **renouvelle** plus qu'elle ne s'**accumule**. Le noyau dur — 4 professeurs présents les trois années — est minuscule.

C'est **l'enjeu stratégique n°1** : transformer l'essai. La machine à acquérir fonctionne remarquablement ; la machine à faire revenir reste à construire. Quelques signaux positifs de fidélité existent : **27 « triplets » (prof × activité × établissement) sont rejoués sur 2 années ou plus** — des professeurs qui reconduisent la même activité avec une nouvelle promo (ex. la même séance « Intro IA » rejouée à 448 jours d'écart, 31 puis 29 élèves).

---

## 9. Patterns pédagogiques fins

Au-delà du volume, comment l'outil est-il *réellement* utilisé en classe ?

- **Petit groupe puis classe entière.** **46 professeurs** ont fait une petite séance (≤6 élèves — souvent leurs propres comptes-test) **avant** une vraie classe (≥10) quelques jours plus tard. C'est le pattern de découverte canonique : *on essaie à petite échelle, on lance la classe entière 2-4 jours après* (ex. 2 élèves le 19/05 → 41 élèves le 23/05).
- **Le travail ne s'arrête pas à la séance.** **21,7 % des copies-élèves** sont modifiées plus d'1 h après leur création (médiane 51 h ; 461 copies rouvertes après une semaine). Les élèves **reprennent réellement** leur travail — l'activité n'est pas one-shot.
- **Le travail à domicile existe, mais à la marge.** **7,4 %** des clones sont créés hors temps scolaire (**4,1 % le week-end**, 3,8 % en soirée/nuit). L'usage reste massivement **en classe**.
- **Parcours multi-activités.** **52 professeurs sur 224 (23 %)** enseignent ≥2 activités, 16 en font ≥3. La progression-type est **Statistiques → Géométrie** (18 profs) : on entre par la classification de données, on bascule vers la géométrie repérée — un **parcours annuel cohérent** avec le programme de 2nde.

---

## 10. Profil social des établissements : un public légèrement favorisé, sans élitisme

L'indice de position sociale (IPS) des lycées utilisateurs est **légèrement supérieur** à la moyenne nationale des lycées :

| | Lycées MathAData | Lycées France |
|---|---:|---:|
| IPS moyen | **110,4** | 107,0 |
| IPS médian | 109,1 | 105,7 |

L'écart (**+3,4 points**) est réel mais **modéré** : MathAData n'est **pas** réservé aux lycées d'élite. Il touche un public socialement représentatif, avec un léger biais vers les établissements un peu plus favorisés — typique d'une diffusion par des enseignants innovants, souvent dans des lycées généraux bien équipés en salles informatiques. Les nouveaux profs 2025-2026 confirment ce profil (IPS moyen 110,1).

---

## 11. Robustesse, vérification et limites

**Vérification.** Les KPI ont été **recalculés par trois agents indépendants** directement depuis le CSV brut + l'annuaire. Concordance confirmée sur : volumes par année (150/2 181/4 479 élèves), 261 profs, **5 854 élèves uniques**, répartition lycée/collège (219/7), secteur (222/4), **IPS (110,4 vs 107,0)**, top 10 = 21 %, rétention 30 %, distribution des années d'enseignement, et 404 élèves pour le pionnier.

**Le seul écart** porte sur le **comptage des séances** : 738 (en conservant tous les clones, y compris ceux sans établissement) vs 613 (en excluant les clones non localisés). Les deux convergent sur l'essentiel : **taille médiane de classe = 17** et **~260-300 vraies classes (≥10)** — invariants à la méthode. Le nombre de séances est donc un **ordre de grandeur** (~600-740), pas une valeur exacte.

**Limites.**
- **2025-2026 est incomplète** (extraction 19 juin) : les comparaisons inter-annuelles **sous-estiment** l'année en cours ; la croissance réelle est un plancher.
- Le **« test »** mesuré est un clone enregistré, pas l'appropriation réelle (cf. §2).
- Les **séances** et les **classes** sont des reconstructions par clustering temporel, pas des données natives.
- 195 lignes « rôle vide » proviennent d'un **unique compte de démonstration**, exclu de toute l'analyse. Un **compte pionnier** (id « 0 », 404 élèves) est conservé mais systématiquement signalé.
- Les identifiants sont **pseudonymisés et sensibles** ; aucune ré-identification n'a été tentée.

---

## 12. Recommandations issues des données

1. **Faire de la rétention la priorité n°1.** Le point faible n'est pas l'acquisition (excellente) mais le retour d'une année sur l'autre (**30 %**). Cibler dès la rentrée les **62 professeurs de 2024-2025 qui n'ont pas réenseigné**, avec une relance et les nouveautés du catalogue.
2. **Activer la contagion intra-établissement.** **80 % des établissements n'ont qu'un prof**, et le frein n'est pas l'essai raté mais l'absence de second prof. Outiller le prof-pionnier pour embarquer un collègue (kit « présenter MathAData en réunion de cabinet ») démultiplie sans coût d'acquisition. Le lancement conjoint (Bègles) et la diffusion échelonnée (Calais) prouvent que ça marche.
3. **Retravailler la conversion d'« Équation réduite de droite ».** Forte curiosité (39 testeurs) mais conversion la plus basse (49 %) : lever le frein de mise en classe (fiche de déroulé, durée, prérequis) ou différencier sa valeur ajoutée face au cours classique.
4. **Concentrer l'accompagnement sur janvier-juin**, où se joue ~80 % de l'activité, et préparer la **montée en charge de mai**.
5. **Capitaliser sur le modèle « un gros lycée = un foyer ».** Identifier et accompagner les établissements-grappes émergents (Bègles, Calais, Nantes, Limoges) comme têtes de pont académiques.
6. **Assumer — ou corriger — la cible.** Tant que le catalogue est « 2nde/1ère générale », MathAData restera un outil de lycée public. Pour exister au collège, il faut un **contenu collège dédié** ; sinon, autant assumer le positionnement lycée dans la communication.

---

*Rapport établi le 19 juin 2026 — données Capytale `capytale_fresh_20260619.csv` (7 353 lignes) + annuaire (12 455 établissements). Graphiques dans `charts/`. Pipeline reproductible et vérifié (3 recomputations indépendantes).*
