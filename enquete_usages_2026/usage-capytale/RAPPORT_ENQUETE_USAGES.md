# Enquête sur les usages de MathAData
### Ce que les données Capytale révèlent du déploiement réel en classe

> **Données** : extraction Capytale du **19 juin 2026** — 7 353 affectations, **401 enseignants engagés** (dont 261 distributeurs), **5 854 élèves uniques**, **12 activités**, **24 académies**, **52 départements**. Période : décembre 2023 → juin 2026.
> **Méthode et définitions** : [DEFINITIONS.md](DEFINITIONS.md). Tous les chiffres proviennent de `data/facts.json`, recalculés et **vérifiés par trois recomputations indépendantes** (voir §11). Pipeline reproductible : `build_canonical.py` → `compute_facts.py` → `make_charts.py`.

---

## 0. Synthèse en une page

En 2025-2026, MathAData a franchi le seuil qui sépare une **expérimentation pilote** d'un **outil diffusé nationalement**. Le volume d'usages élèves a **plus que doublé** (2 181 → 4 479, **+105 %** en lignes-usage ; ≈ +95 % en élèves distincts) — l'année scolaire étant close à la mi-juin, l'extraction du 19 juin la capte quasi intégralement. Six vérités structurantes ressortent des données :

1. **C'est un outil de lycée, public, de seconde.** En usage classe, 97 % des enseignants sont en lycée, **98 % dans le public**, et l'essentiel du catalogue cible la 2nde. Le collège ne décolle pas *en classe* (≈ 5 collèges avec de vrais élèves) — même si l'**intérêt** y existe via la formation (§2).

2. **L'entonnoir : beaucoup d'essais, peu de classes.** **401 enseignants** ont mis la main sur MathAData ; **224 (56 %) l'ont donné à leurs propres élèves** ; **177 ont seulement testé** — dont **140 vus uniquement en formation**. La formation remplit le haut de l'entonnoir ; la conversion formation → classe **mesurée ici (Capytale seul)** paraît **très faible (~4 %)** — mais ce taux est **trompeusement bas** (récence des formations, grain compte). La mesure de référence est au **grain établissement** (cf. **Volet 2** : ~17-30 % selon le type, jusqu'à 59 % en formation établissement-ciblée).

3. **L'adoption en classe est directe et solitaire.** Les **deux tiers** des profs qui enseignent donnent l'activité *sans trace de test personnel préalable*, et **80 % des établissements n'ont qu'un seul professeur utilisateur**. MathAData se diffuse prof par prof, peu par contagion entre collègues.

4. **La croissance est extensive, pas intensive.** **83 % des professeurs qui enseignent en 2025-2026 sont entièrement nouveaux**, et ils génèrent **74 % du volume** de l'année. L'effet net des professeurs déjà présents est **marginal** (quasi stable en volume d'usages, léger recul en élèves distincts ; n=26). La machine à *recruter* fonctionne ; la machine à *faire revenir* est à construire (rétention inter-annuelle de **30 %**).

5. **Le moteur du contenu, ce sont les statistiques et la géométrie « programme ».** La croissance 2025-2026 est portée par les statistiques (+1 340 usages) et la géométrie analytique (+1 236), tandis que l'activité historique « Intro à l'IA » **recule** (−485). MathAData réussit sa mue d'un gadget « IA » vers un outil arrimé au programme de seconde.

6. **Un tiers des profs entrent par Capytale, pas par le site.** 32 % des enseignants découvrent MathAData via l'ancienne activité « Intro à l'IA » (absente de mathadata.fr) et **63 n'utilisent qu'elle** — sans déployer d'autre activité du catalogue. Canal d'acquisition gratuit, mais aussi fuite à colmater.

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

> **Et le collège ? Distinguer l'intérêt (formation) et l'usage (classe).** Sur la carte du dashboard apparaissent de nombreux collèges — surtout autour de **Dunkerque** — qui semblent avoir « testé une fois sans enseigner ». Vérification faite, ce sont bien de **vrais professeurs de collège** : on en compte **47 « engagés »** (qui ont cloné l'activité), mais ils l'ont fait **en formation** (ils restent `role=teacher`, géolocalisés à leur collège via `uai_el` — voir §2 et §11). Le cas emblématique : le **6 juin 2025**, une **journée de formation du réseau dunkerquois** animée depuis le **lycée des Flandres (Hazebrouck)** a touché ~35 collèges en une fois.
>
> Mais **l'usage en classe, lui, ne décolle pas** : **seuls ~5 collèges ont de vrais élèves**. Autrement dit, **l'intérêt collège est réel (formation), l'adoption classe quasi nulle** — faute d'activité pensée pour ses programmes. C'est un signal précieux : la donnée distingue déjà *qui a été formé* de *qui a enseigné*.

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

Ce palmarès n'est pas qu'une affaire de qualité pédagogique — il reflète aussi l'**architecture d'accès** :
- **« Statistiques – classification de chiffres »** est la **vitrine** de mathadata.fr : première activité présentée et **la seule accessible sans compte**. C'est la porte d'entrée naturelle, ce qui explique une partie de sa domination (et de son fort taux de conversion, §2.2).
- **« Intro à l'IA : chiffres 2 et 7 »** est au contraire une **ancienne activité, non mise en avant et absente du site** : on ne peut la trouver **que** via Capytale. Sa persistance n'est donc pas anodine — elle trace une population de professeurs qui découvrent MathAData **directement sur Capytale**, sans passer par le site (voir §1.4).

### 1.3 La « classe » type : un demi-groupe de 17 en salle info

En regroupant les clones élèves par professeur, activité et proximité temporelle (fenêtre 3 h), on reconstitue **~700 séances** (738 dans le paramétrage de référence ; 613 si l'on exclut les clones sans établissement — voir §11). Toutes ne sont pas des classes : ~220 séances ne comptent qu'un élève (tests, élèves isolés). Mais **~290 séances réunissent ≥10 élèves**, et leur **taille médiane est de 17** (moyenne 19, quartiles 13–25) — *un résultat stable quelle que soit la méthode de regroupement.*

C'est exactement la signature d'un **TP en salle informatique en demi-groupe** :

- **41,8 %** des classes tombent dans la fourchette **12–18 élèves** (demi-groupe, ~18 postes en salle info) ;
- **25,2 %** dans la fourchette 24–36 (groupe-classe complet).

La taille de demi-groupe est donc **la taille de séance dominante**. Par activité, statistiques (médiane 17), Intro IA (16) et équation de droite (15) sont des activités de demi-groupe ; seules « Géométrie repérée » (médiane **25**) et « Droite & produit scalaire » (20) montent vers la classe entière.

> **⚠️ Nuance (renvoi à [Séances](../transverse/RAPPORT_SEANCES_2026.md) §III).** Une séance de ~17 est *cohérente* avec un demi-groupe en salle info, mais ce n'est qu'une **inférence de taille**. Quand on cherche la *signature vérifiable* d'un vrai dédoublement — **deux séances complémentaires le même jour** — on ne la trouve que chez **~10 professeurs** (et ~4 dédoublements équilibrés nets). Autrement dit, beaucoup de séances de 17 sont plutôt de **petites classes entières ou des groupes partiels** que des demi-groupes confirmés. Les vrais demi-groupes sont rares et se concentrent chez des pionniers, en établissements un peu plus favorisés (IPS médian 115 vs 110) — un point clé pour l'objectif « vrais demi-groupes » de 2026-2027.

### 1.4 Deux portes d'entrée : le site-vitrine et le « Capytale-direct »

Puisque « Intro à l'IA » n'existe **que** sur Capytale, son usage est un **traceur** d'un canal d'acquisition parallèle au site. Le constat est net :

- **83 professeurs sur 261 (32 %) sont *entrés* par « Intro à l'IA »** — c'est leur toute première activité dans l'ordre chronologique, quasi à égalité avec la vitrine Statistiques (78).
- **63 professeurs n'utilisent *que* « Intro à l'IA »** et rien d'autre ; ils ont porté ~1 070 usages élèves (et 55 d'entre eux ont bien enseigné).
- Parmi tous ceux qui touchent « Intro à l'IA », **seuls 16 % touchent aussi la vitrine** Statistiques.

Autrement dit, **près d'un tiers des professeurs découvrent MathAData directement via Capytale**, sans passer par mathadata.fr — et **n'ont déployé aucune autre activité du catalogue** (santé, géométrie, challenges…), qu'ils n'ont vraisemblablement jamais parcouru. C'est à la fois un **canal d'acquisition gratuit** (le référencement Capytale travaille pour le projet) et une **fuite** : ces enseignants restent captifs d'une activité ancienne qu'on ne souhaite pas mettre en avant. Les rediriger vers le site — par exemple un bandeau « Découvrez les autres activités sur mathadata.fr » dans « Intro à l'IA » — est un levier à coût quasi nul.

---

## 2. Patterns d'usage : l'entonnoir de l'engagement

### 2.0 401 engagés, 224 en classe, 177 testeurs

Le point de départ a été corrigé en cours d'enquête (voir §11). Dans Capytale, **`role` est le *type* de compte** : un professeur reste `role=teacher` même quand il **clone l'activité en formation** (il devient alors le « clone-owner » dans la colonne `student`, géolocalisé à son établissement via `uai_el`, le formateur figurant dans `teacher`). Conséquence : la vraie population enseignante n'est pas 261 (les seuls *distributeurs*) mais **401 comptes engagés**.

```
401 professeurs ont mis la main sur MathAData
        │
        ├── 224 (56 %) l'ont donné à LEURS élèves      → adoption en classe
        │
        └── 177 (44 %) ont SEULEMENT testé
                 ├── 140 vus uniquement EN FORMATION (stagiaires)
                 └──  37 distributeurs ayant testé sans jamais enseigner
```

> **⚠️ Terminologie : « stagiaire » est un raccourci trompeur.** Dans ce rapport (Capytale seul), « stagiaire » désigne un compte **vu seulement en formation** (clone créé pendant une séance de formation, jamais déployé). Ce sont, **en quasi-totalité, des profs EN EXERCICE** en formation continue — *pas* des stagiaires/pré-service. Seule la minorité **pré-service** (INSPÉ/MEEF) est un vrai « stagiaire sans classe », et elle n'est identifiable que par les libellés de formation **côté site** (Volet 2). Lire « stagiaire » ci-dessous comme « vu seulement en formation ».

Deux enseignements forts :

- **La formation est un puissant haut d'entonnoir… à rendement à mesurer au bon grain.** Sur les **148 comptes vus en formation**, seuls **6 (≈ 4 %) ont ensuite enseigné** *côté Capytale*. ⚠️ Ce taux est **trompeusement bas** : il est biaisé par la **récence** des formations et le **grain compte** (anonyme). La mesure de référence est celle du **[Volet 2](../site-vers-classe/RAPPORT_VOLET2.md) §3, au grain établissement** (historique complet, non biaisé) : **~17-30 % selon le type**, **46 % pour les cohortes mûres**, et surtout **établissement-ciblée 59 % vs masse 10 %**. La conversion post-formation est donc **modérée et très inégale**, pas catastrophique.
- **La formation explique l'intérêt collège** : sur les 140 stagiaires, **40 sont en collège**, 27 en lycée, 73 sans établissement renseigné. C'est cohérent avec ce que montre la carte (§1.1) — des profs de collège formés, mais qui n'enseignent pas (encore) à leurs classes.

Ce haut d'entonnoir est animé par une douzaine de **formateurs** identifiables dans la donnée : **`dda7f8a1`** (lycée des Flandres, Hazebrouck — **37 stagiaires** sur 34 établissements), `6a44e026` (28), `2f6f9511` (15, n'enseigne pas lui-même), `cace46c6` (12)… À eux seuls, les formateurs portent **~39 % des lignes de test**. Ce sont les opérateurs des formations — que les données officielles à venir permettront de nommer et dater.

### 2.1 Tester ou plonger ? (parmi ceux qui enseignent)

Selon qu'une activité a été clonée comme « test enseignant » (`role=teacher`) avant — ou jamais — d'être donnée aux élèves, on distingue trois trajectoires :

| Trajectoire | Professeurs | Part |
|---|---:|---:|
| **Enseigné sans test préalable** (plongée directe) | **172** | **66 %** |
| **Testé puis enseigné** (la voie « manuel ») | 52 | 20 % |
| **Testé, jamais enseigné** (parmi les distributeurs) | 37 | 14 % |

*(Lecture parmi les **261 comptes distributeurs**. Le « testé jamais enseigné » global est de **177** une fois ajoutés les 140 stagiaires de formation — §2.0.)*

Résultat contre-intuitif et central : **les deux tiers des professeurs lancent MathAData en classe sans test personnel enregistré**. Parmi les **224 professeurs ayant effectivement enseigné, seuls 52 (23 %)** ont laissé une trace de test avant leur première classe.

> **Précaution de lecture.** « Test » = un clone explicitement `role=teacher`. Un enseignant peut s'approprier une activité (la lire, la projeter, l'essayer via le code qu'il partagera) sans produire ce clone. Le chiffre mêle donc de vraies adoptions « à froid » et une appropriation informelle invisible. Dans les deux cas, le message est le même : **le parcours « test → classe » n'est pas le parcours dominant**. Beaucoup de professeurs font confiance à l'activité — recommandée par un pair, une formation, l'équipe — et la lancent directement.

### 2.2 Quand on teste, on enseigne… le jour même

Pour les 52 professeurs « testé puis enseigné », le délai test → première classe est **très court** :

- **médiane : 2,3 jours** ;
- **38,5 % testent le jour même** de leur première classe ;
- **63,5 % sous 7 jours**, 80,8 % sous 30 jours.

Le « test », quand il a lieu, fonctionne donc comme une **mise en place de séance** (la veille, le jour même) bien plus que comme une longue évaluation préalable. Une petite queue (10 profs) revient enseigner > 30 jours après — parfois **une année scolaire entière** après leur test initial.

### 2.3 La conversion test → classe dépend de l'activité

Quand un professeur *teste* une activité, ira-t-il jusqu'en classe ? Le taux varie fortement :

| Activité | Profs testeurs | Conversion test → classe |
|---|---:|---:|
| Statistiques – classification de chiffres | 46 | **74 %** 🟢 |
| Droite & produit scalaire (1ère) | 11 | 64 % |
| Statistiques – santé du fœtus | 15 | 60 % |
| Intro à l'IA – chiffres 2 et 7 | 42 | 57 % |
| Géométrie repérée (milieu/distance) | 9 | 56 % |
| **Équation réduite de droite** | 39 | **49 %** 🔴 |

Ce classement doit toutefois se lire à la lumière de **deux biais d'architecture** — pas seulement de la valeur pédagogique :

- **Statistiques** est la **vitrine sans compte** du site (§1.2) : elle attire des professeurs déjà décidés, d'où une conversion élevée (**74 %**). C'est aussi l'activité la plus utilisée en formation : **62 % de ses clones-tests proviennent de formateurs/animateurs**.
- **« Équation réduite de droite »** est elle aussi très utilisée **en formation** : **58 % de ses clones-tests viennent des formateurs**. Beaucoup de profs la clonent pour **apprendre l'outil** plus que pour déployer ce chapitre. Elle est **2ᵉ en nombre de clones-tests (96, ~2,5 par testeur)** mais seulement **3ᵉ en testeurs uniques (39)** — « beaucoup de manipulation, peu de déploiement ». Sa conversion basse (**49 %**) **ne traduit donc pas une faiblesse pédagogique**, mais son **rôle de support de formation**.

À l'opposé, **« Intro à l'IA »** (canal Capytale-direct, §1.4) n'a que **25 %** de tests issus de formateurs : ses testeurs sont surtout des profs isolés trouvant l'outil seuls. La conversion mesurée dépend ainsi autant du **rôle de l'activité** (vitrine / formation / découverte spontanée) que de sa qualité. Les **données de formation à venir** permettront de mesurer directement cet effet (voir §2.0 et §5).

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

> **⚠️ Mise en cohérence (renvois [Typologie](../transverse/TYPOLOGIE_PROFILS_2026.md) §III et [Séances](../transverse/RAPPORT_SEANCES_2026.md)).** Deux nuances importantes sur la contagion, issues du suivi fin :
> 1. **Le collectif augmente le nombre d'usagers, pas le taux de retour.** Être en établissement multi-prof ne change rien à la rétention (30 % multi-prof vs 31 % solo, p=0,87) : c'est un **nul confirmé**. Et le suivi de la diffusion montre que les **collègues recrutés adoptent un usage plus léger** (déploiement ponctuel) et **n'héritent pas de la fidélité du pionnier**. La contagion sert l'objectif « plus de profs », pas mécaniquement l'objectif « usage durable/profond ».
> 2. **« Même année » ≠ « même mois ».** Les 64 % de « lancement conjoint » sont mesurés *au grain année* ; au grain *mois*, seuls **25 %** des établissements multi-profs démarrent réellement le même mois — l'écart médian d'entrée entre collègues est de ~2 mois. La diffusion est donc plus **échelonnée** qu'il n'y paraît, semée par un pionnier souvent intensif.

### 3.1 Quatre études de cas

- **Lycée Léonard de Vinci, Calais (Lille)** — *diffusion échelonnée, le plus gros foyer collégial.* Un noyau de 3 profs en 2024-2025 (fév-mars 2025) entraîne **3 collègues** en 2025-2026 : **6 professeurs, ~297 élèves, 21 séances**. Cas-école de tache d'huile, devenu **auto-portant sans le pionnier historique**.
- **Lycée Louis Pasteur, Lille** — *diffusion la plus longue.* Un pionnier dès 2023-2024, rejoint par un collègue en 2024-2025, puis deux nouveaux en 2025-2026 : **4 profs, 161 élèves sur 3 ans** — environ un professeur de plus par an.
- **Lycée Vaclav Havel, Bègles (Bordeaux)** — *lancement conjoint le plus intense.* Les **3 profs démarrent tous en 2025-2026**, à quelques jours d'écart (mars-mai 2026), **sans aucun pionnier antérieur** : **283 élèves**, tous en adoption directe. C'est le **plus gros établissement moteur de la période** — à lui seul, il propulse Bordeaux au 3e rang des académies.
- **Lycée de Haubourdin (Lille)** — *la limite de la diffusion.* Le compte pionnier (404 élèves sur 3 ans, en solo) n'a entraîné **qu'un seul collègue**, et tardivement (mai 2026, 27 élèves). Une activité individuelle intense **ne se traduit pas mécaniquement** en diffusion locale.

> La dynamique collégiale est géographiquement **concentrée dans l'académie de Lille** (Calais, Haubourdin, Pasteur, Genech, Hazebrouck, Lambersart, César Baggio…) : c'est là que l'effet « tache d'huile » inter-collègues est le plus visible — héritage du foyer pionnier nordiste.

---

## 4. La croissance 2025-2026 : qui la porte ?

L'année 2025-2026 a **plus que doublé** le volume de 2024-2025. *(L'année scolaire s'éteint à la mi-juin — en 2024-25, plus aucune séance après le 12 juin — donc l'extraction du 19 juin la couvre quasi intégralement : la comparaison est juste, pas un plancher.)*

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

L'intensité progresse tout de même modérément (élèves/prof 24,8 → 29,7 ; séances/prof 2,6 → 3,05), mais les nouveaux profs sont **plus petits** (médiane 20 élèves) que les récurrents (médiane 47,5). Un revers : **62 professeurs de 2024-2025 n'ont pas réenseigné** en 2025-2026 (~1 116 élèves « perdus ») — soit un vrai churn, soit un retour différé à 2026-2027 (non encore observable). L'année 2025-26 étant quasi close au 19 juin, ce n'est pas un artefact de calendrier.

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

## 5. Les testeurs non convertis : le grand réservoir de la formation

C'est ici que la correction du §2.0 change le plus l'image. **177 enseignants ont testé sans jamais enseigner à leurs élèves** — bien plus que les 37 que voyait ma première lecture (limitée aux distributeurs). La différence, ce sont les **140 stagiaires de formation**, invisibles tant qu'on ne lisait pas la colonne `student` des lignes test.

| Sous-population « testé sans enseigner » (177) | Effectif |
|---|---:|
| **Stagiaires de formation** (vus uniquement via un formateur) | **140** |
| dont en **collège** | 40 |
| dont en lycée | 27 |
| dont établissement inconnu | 73 |
| **Distributeurs ayant testé sans élèves** | 37 |

Deux lectures complémentaires :

- **Le vivier de formation est énorme et peu converti.** Sur les **148 comptes vus en formation, ~6 (4 %) ont enseigné** ensuite à leurs propres élèves (§2.0). C'est *le* point de fuite : on forme beaucoup, on convertit peu — du moins à ce stade (formations souvent récentes).
- **Parmi les distributeurs**, l'hypothèse « non-convertis = surtout collège » est **démentie** : les 14 *vrais* non-adoptants (testé en 2024-25 ou avant, jamais enseigné) sont **11 lycées, 3 inconnus, 0 collège**, 100 % public. Ce ne sont pas des essais bâclés (médiane **2 tests**, l'un a testé 7 activités) : c'est un **échec d'activation**, pas un manque d'essai. Le collège, lui, est sur-représenté côté **stagiaires** (40), pas côté distributeurs — ce qui colle au récit « intérêt collège via formation, pas en classe » (§1.1).

**Géographiquement**, ces testeurs isolés se concentrent là où l'animation est active : **Montpellier (6), Paris (5), Lille (5)**, Créteil (3). On les trouve souvent **seuls dans leur lycée** (établissement mono-prof), éparpillés — à Dunkerque (Auguste Angellier), Lille (César Baggio), Aulnay-sous-Bois (Voillaume), Saint-Martin-d'Hères (Pablo Neruda)… Le cas le plus parlant est le **lycée Jean Jaurès (Saint-Clément-de-Rivière, Montpellier)** : *deux* collègues y ont testé, à deux ans d'écart, **sans qu'aucun n'enseigne jamais** — la curiosité se transmet, l'adoption non.

> **Hypothèse à tester avec les données de formation (à venir).** Ce profil — testeur isolé, souvent sur « Équation réduite », dans les académies à forte animation (Lille, Bordeaux, Montpellier) — ressemble fortement à celui d'un **enseignant passé par une formation** qui a créé un compte, exploré l'outil, mais n'a pas (encore) franchi le pas. Les dates et lieux de formation permettront de confirmer ce lien et surtout de mesurer **quelles formations convertissent réellement en usage classe, comment, et après combien de temps.**
>
> **Un avant-goût est déjà lisible dans les données.** La journée du **6 juin 2025** dans le dunkerquois — un animateur (lycée des Flandres, Hazebrouck) qui clone l'activité pour **~35 collèges en une fois** (§1.1) — est une **empreinte de formation** brute. Avec le calendrier officiel des formations, on pourra repérer systématiquement ces pics, puis suivre si les participants reviennent ensuite enseigner avec leurs propres élèves.

---

## 6. Les power users : une concentration modérée

L'usage est-il porté par une poignée de super-utilisateurs ? **Moins qu'on ne le craindrait.**

- Le **top 10 des professeurs** concentre **21 %** des élèves uniques (17 % une fois retirés les comptes hub/formateur) ; le top 20, environ un tiers.
- **Coefficient de Gini** des élèves/prof : **0,49** parmi les professeurs enseignants — une inégalité réelle mais **loin d'un monopole**.
- Le professeur médian (parmi les enseignants) anime **2 séances** ; seuls **9 professeurs** ont animé 10 séances ou plus.

**Le « plus gros prof » n'en est pas un — c'est un hub.** Le compte n°1 (identifiant séquentiel « 0 ») affiche 404 élèves, mais ils sont **répartis sur 14 établissements** (Haubourdin, Lille, Orsay, Toulouse, **Papeete**, Guéret, Calais, Massy…) : **seulement 56 à Haubourdin**. C'est le **compte-maître du réseau pilote** (le fondateur), pas un professeur local hyperactif. Une fois ce hub et les formateurs mis de côté, le plus gros enseignant *organique* est bien plus modeste — d'où une concentration réelle **encore plus faible** qu'affichée : la base s'est largement **déconcentrée** depuis les débuts lillois (cf. §7).

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

**Une correction majeure en cours d'enquête.** La première version comptait **261 professeurs** (les seuls *distributeurs*, colonne `teacher`). Or `role` est le **type de compte** : un prof **en formation** reste `role=teacher` et n'apparaît que dans la colonne `student` des lignes test. En intégrant cette couche, la population enseignante réelle est de **401 comptes engagés** (224 ont enseigné, 177 ont seulement testé dont 140 stagiaires). **Les chiffres élèves, eux, sont confirmés intacts** : `role=student` = vrais élèves (0 compte-prof parmi les 5 854).

**Vérification.** Les KPI élèves/croissance/géo ont été **recalculés par trois agents indépendants** depuis le CSV brut + l'annuaire. Concordance confirmée : volumes par année (150/2 181/4 479 élèves), **5 854 élèves uniques**, secteur/type, **IPS (110,4 vs 107,0)**, rétention 30 %, distribution des années d'enseignement.

**Le seul écart** porte sur le **comptage des séances** : 738 (en conservant tous les clones, y compris ceux sans établissement) vs 613 (en excluant les clones non localisés). Les deux convergent sur l'essentiel : **taille médiane de classe = 17** et **~260-300 vraies classes (≥10)** — invariants à la méthode. Le nombre de séances est donc un **ordre de grandeur** (~600-740), pas une valeur exacte.

**Limites.**
- **L'année scolaire se termine à la mi-juin** : en 2024-2025, plus aucune séance après le **12 juin** (rien en juillet). L'extraction du 19 juin 2026 couvre donc 2025-2026 **quasi intégralement** ; les comparaisons inter-annuelles sont justes (le seul angle mort est un éventuel **retour à N+1**, mesurable seulement l'an prochain).
- Le **« test »** mesuré est un clone enregistré, pas l'appropriation réelle (cf. §2).
- Les **séances** et les **classes** sont des reconstructions par clustering temporel, pas des données natives.
- 195 lignes « rôle vide » proviennent d'un **unique compte de démonstration**, exclu de toute l'analyse. Un **compte pionnier** (id « 0 », 404 élèves) est conservé mais systématiquement signalé.
- **`uai_el` vs `uai_teach` sur les lignes de test.** Sur un clone `role=teacher`, `uai_el` ne désigne pas l'établissement du prof mais peut pointer un **établissement-cible** (ex. le collège visé lors d'une formation). La carte du dashboard géolocalisant par `uai_el`, des **« points fantômes »** apparaissent (45 collèges référencés, mais 40 sans aucun élève — une empreinte de formation, pas une adoption ; §1.1). Pour classer un **professeur**, cette enquête privilégie `uai_teach` (son établissement de rattachement), ce qui donne une lecture différente — et complémentaire — de la carte.
- Une douzaine de **comptes formateurs/animateurs** (dont `dda7f8a1`, lycée des Flandres) portent **~39 % des lignes de test** : les comptages de *tests* par activité reflètent largement l'activité de formation, pas seulement l'exploration spontanée.
- Le **compte « 0 »** est un **hub fondateur** (404 élèves sur 14 établissements) : il fausse les vues *par professeur* et *par établissement* (pas les totaux ni la géographie par `uai_el`). Traité à part.
- Les identifiants sont **pseudonymisés et sensibles** ; aucune ré-identification n'a été tentée.

---

## 12. Recommandations issues des données

1. **Faire de la rétention la priorité n°1.** Le point faible n'est pas l'acquisition (excellente) mais le retour d'une année sur l'autre (**30 %**). Cibler dès la rentrée les **62 professeurs de 2024-2025 qui n'ont pas réenseigné**, avec une relance et les nouveautés du catalogue.
2. **Activer la contagion intra-établissement — pour le *nombre*, en accompagnant la *profondeur*.** **80 % des établissements n'ont qu'un prof**, et le frein n'est pas l'essai raté mais l'absence de second prof. Outiller le prof-pionnier pour embarquer un collègue (kit « présenter MathAData en réunion de cabinet ») démultiplie sans coût d'acquisition. Le lancement conjoint (Bègles) et la diffusion échelonnée (Calais) prouvent que ça marche **pour recruter**. *Réserve (cf. §3) : les collègues recrutés adoptent un usage plus léger et ne retiennent pas mieux — la contagion ne suffit pas, il faut l'assortir d'un accompagnement vers l'usage profond (2ᵉ activité, vraie séance salle info).*
3. **Récupérer les profs « Capytale-direct ».** Un tiers des enseignants entrent par « Intro à l'IA » et **63 n'utilisent que l'activité historique**. Un simple bandeau « Découvrez les autres activités sur mathadata.fr » dans l'activité historique peut convertir ce trafic gratuit en découverte du catalogue — levier à coût quasi nul, fort potentiel.
4. **Concentrer l'accompagnement sur janvier-juin**, où se joue ~80 % de l'activité, et préparer la **montée en charge de mai**.
5. **Capitaliser sur le modèle « un gros lycée = un foyer ».** Identifier et accompagner les établissements-grappes émergents (Bègles, Calais, Nantes, Limoges) comme têtes de pont académiques.
6. **Convertir le vivier de la formation — l'angle mort n°1.** **140 profs formés n'ont jamais enseigné à leurs élèves** (conversion ~4 %). C'est le plus gros gisement d'usage dormant, et il est **collège-friendly** (40 d'entre eux). Une relance systématique post-formation (« passez à votre première classe » : kit + créneau de support à J+15) peut activer ce stock. À industrialiser dès que les **données de formation** seront croisées (voir ci-dessous).
7. **Assumer — ou corriger — la cible.** Tant que le catalogue est « 2nde/1ère générale », MathAData restera un outil de lycée public. Pour exister au collège, il faut un **contenu collège dédié** ; sinon, autant assumer le positionnement lycée dans la communication.

> **Prochaine étape analytique.** Les **données de formation** (dates, lieux, nombre de profs formés par lycée) permettront de relier l'amont (qui a été formé, quand, où) à l'aval mesuré ici (qui a testé, qui a enseigné, quand). On pourra alors répondre aux vraies questions de pilotage : **quelles formations ont généré de l'usage réel, avec quel délai, et quel taux de conversion** — et distinguer les testeurs isolés « en attente d'activation » des abandons.

---

## Annexe — Galerie d'études de cas

Rien ne vaut le zoom sur des situations réelles pour sentir la diversité des usages. Neuf profils contrastés (établissements et profs pseudonymisés) :

### Les moteurs

- **🟢 Lycée Vaclav Havel — Bègles (Bordeaux)** · *lancement conjoint le plus puissant.* **3 profs démarrent ensemble** en 2025-2026 (mars-mai), sans aucun pionnier antérieur : **283 élèves**, dont **un seul prof à 140 élèves** (le plus gros porteur non-pionnier du dispositif). À lui seul, ce lycée propulse Bordeaux au 3ᵉ rang national. Adoption d'équipe, directe, sans phase de test.
- **🟢 Lycée Léonard de Vinci — Calais (Lille)** · *diffusion échelonnée, le plus gros foyer collégial.* Un noyau de 3 profs en 2024-2025 entraîne **3 collègues** l'année suivante → **6 profs, ~297 élèves, 21 séances**. Devenu **auto-portant**, sans le pionnier historique. La preuve que la tache d'huile interne fonctionne… quand elle s'amorce.
- **🟢 Lycée Louis Pasteur — Lille** · *diffusion lente mais continue.* Un pionnier dès 2023-2024, **+1 collègue par an** : **4 profs, 161 élèves sur 3 ans**. Le modèle d'enracinement durable.

### Les solos

- **🔵 Lycée Ampère — Lyon 2e** · *solo intense pur.* **Un seul prof**, 110 élèves, **47 séances**, 4 activités, sur 2 ans — densité d'usage exceptionnelle, mais **zéro diffusion** : aucun collègue n'a suivi. L'établissement reste mono-prof malgré une activité massive.
- **🔵 Lycée de Haubourdin (Lille) — compte pionnier «  0  »** · *solo historique.* **404 élèves sur 3 ans** portés par un seul prof (94 % des élèves de l'établissement) ; **un seul collègue** l'a rejoint, en mai 2026 (27 élèves). L'intensité individuelle ne crée pas mécaniquement de diffusion.

### Les angles morts

- **🟠 Lycée parisien (Paris 5e) — « Capytale-direct »** · *engagé mais hors-site.* 63 élèves sur 2 ans… **uniquement sur « Intro à l'IA »**. Un prof fidèle resté sur la seule activité historique, sans déployer le catalogue mathadata.fr — l'archétype des **63 profs captifs** (§1.4).
- **🔴 Lycée Jean Jaurès — Saint-Clément-de-Rivière (Montpellier)** · *stagnation à deux.* **Deux** collègues ont testé, à deux ans d'écart, **sans qu'aucun n'enseigne jamais**. La curiosité s'est transmise, l'adoption non — le profil-type du **testeur isolé** (§5), candidat n°1 à une relance post-formation.

### Les marges qui marchent

- **🟢 Lycée Paul Gauguin — Papeete (Polynésie)** · *l'équipe d'outre-mer.* **4 profs**, diffusion **par paires chaque année** (76 élèves). La dynamique collégiale n'est ni un effet métropolitain ni lillois.
- **🟢 Collège César Franck — Paris 2e** · *le collège qui y arrive.* 23 élèves, 4 séances, comportement « enseigné puis testé ». Le meilleur cas collège — petit mais réel, là où l'on n'attendait presque personne.

---

*Rapport établi le 19 juin 2026 — données Capytale `capytale_fresh_20260619.csv` (7 353 lignes) + annuaire (12 455 établissements). Graphiques dans `charts/`. Pipeline reproductible et vérifié (3 recomputations indépendantes). Précisions de contexte (vitrine sans compte, « Intro à l'IA » hors-site, « Équation réduite » en formation) intégrées le 20 juin 2026.*
