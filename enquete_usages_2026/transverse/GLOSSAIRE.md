# GLOSSAIRE CANONIQUE — enquête usages MathAData

> **Source de vérité unique des définitions.** Toute analyse (volet 1, volet 2, typologie,
> séances, synthèse, flux) et tout calcul de variable s'appuient sur **ce fichier**.
> En cas de divergence entre un rapport et ce glossaire, **le glossaire fait foi** ;
> le rapport est à corriger. Les `DEFINITIONS.md` de chaque dossier ne contiennent plus
> que les **spécificités de source** (chemins, schémas) et **pointent ici** pour le sens.
>
> Implémenté par [`transverse/build_profiles.py`](build_profiles.py) (couche de calcul
> canonique par *prof × année*). Toute nouvelle variable dérivée doit naître là.

Extraction de référence : **Capytale 2026-06-19**, **Payload mathadata.fr 2026-06-20**.

---

## 0. Les deux mondes (rappel structurant)

Deux sources **disjointes**, sans clé commune directe :

- **Capytale** — usage en classe, **anonyme** (comptes ENT pseudonymisés en MD5). Couvre **2023→2026**.
- **mathadata.fr (Payload)** — parcours amont, **nominatif** (snapshot local, gitignore). Le tracking
  des clics/sessions ne commence que **~27 nov 2025**.

Le seul pont direct : un **clic nominatif** sur le site (`consultation_rss` / `events`
`web/b/<id>`) → une **activité Capytale datée** (`<id> == mathadata_id`). Mais le clonage ENT
en aval reste anonyme. D'où l'**appariement individuel inféré** (signaux A/B/D/E, 75 paires).

**Conséquence cardinale** : selon la variable, le « sujet » est observé dans un monde, l'autre, ou
les deux. Chaque définition ci-dessous précise **dans quel monde elle est mesurée** et son **statut**
(mesuré / estimé).

---

## 1. Unité de temps : l'année scolaire

**Année scolaire `sy`** : la coupure est au **1ᵉʳ août** (et non au 1ᵉʳ septembre). Une activité
d'**août** est rattachée à l'année scolaire qui **commence** (préparation de rentrée), pas à celle qui
s'achève. Règle de calcul (appliquée telle quelle dans le code — `enquete_common.school_year`) :

```
sy(date) = année  si mois ≥ 8  sinon année-1     →  format "2024-2025"
           (donc « 2024-2025 » = 1ᵉʳ août 2024 → 31 juillet 2025)
```

> Août est quasi vide mais **pas** : 4 affectations en août sur 3 ans, dont **2 usages élèves**
> (19-20 août 2024) — rattachés à `2024-2025`. C'est pourquoi la coupure août (≥8), et non septembre,
> est la bonne : ces séances de pré-rentrée appartiennent à l'année qui démarre.

Toutes les dates sont converties en **Europe/Paris** avant calcul. Trois années peuplées :
`2023-2024`, `2024-2025`, `2025-2026`.

> ⚠️ L'année scolaire se termine de fait **mi-juin**. L'extraction du 19 juin 2026 couvre donc
> `2025-2026` **quasi intégralement**. Seul angle mort : le **retour en 2026-2027**, non observable
> (→ statut « censuré à droite », cf. §5).

---

## 2. Personnes & rôles

- **Usage** = 1 ligne Capytale = 1 affectation (clone). Ce n'est ni une personne, ni une séance.
- **Rôle** = **type du compte** qui possède le clone, *pas* sa position dans la chaîne :
  - `role=student` → **vrai élève** (population propre, ~5 854).
  - `role=teacher` → compte **enseignant** (clone de test, ou clone de formation).
  - vide → indéterminé (à exclure des KPI fins).
- **Prof (enseignant)** = un identifiant `teacher` MD5 distinct.
  - Ses **tests** = ses lignes `role=teacher` (auto-clones).
  - Ses **élèves** = ses lignes `role=student` (clones distribués, `teacher` = lui).
  - ⚠️ **Piège n_teacher_clones** : **59 % des profs (133/224) n'ont aucune ligne `role=teacher`**
    (« plongée directe » : ils distribuent sans s'auto-tester). Les colonnes `n_teacher_clones` /
    `n_teacher_accounts` ne comptent **que** les auto-tests → **0 pour 83 UAI** ayant pourtant de
    vrais profs. **Ne jamais** les lire comme « nombre de profs ». Compter les profs =
    `distinct(teacher)` sur les lignes `role=student`.
- **Stagiaire en formation** : clone le code du **formateur** mais reste `role=teacher` ; son id est
  dans la colonne `student` (clone-owner), le formateur dans `teacher`. Il n'apparaît **jamais**
  comme `role=student`. → Les profs-stagiaires ne « polluent » pas la population élève.
- **Comptes à traiter à part** :
  - **EXCLURE** : compte démo `c81e728d…` (= MD5 "2"), 195 lignes rôle-vide.
  - **EXCLURE des KPI** : 9 comptes site `exclude_from_analytics` (équipe/test).
  - **ISOLER (hub fondateur)** : `cfcd2084…` (= MD5 "0"), 404 élèves sur **14 établissements** —
    compte-maître du réseau pilote, jamais un prof local. Sorti des analyses de profils.

---

## 3. Séance, classe, seuils de taille

- **Séance** = run maximal de clones **élèves** de même `teacher` + même `mathadata_id` (activité)
  + même `uai_el`, dont les créations consécutives sont espacées de **< 3 h**. (= un « créneau »
  d'activité élève reconstruit. ⚠️ durée médiane d'un run ≈ 7 min : ce sont des **salves**, pas la
  durée réelle d'un cours.)
- **Seuil « classe » = ≥ 5 élèves** *(décision du 23 juin 2026 ; remplace l'ancien ≥ 10)*. Une
  séance qui atteint **≥ 5 élèves distincts** est un **usage-classe**.
- **Bande « sous-seuil » = 1 à 4 élèves** : séance avec des élèves réels mais **trop peu** pour une
  classe (élèves isolés, micro-test à quelques-uns). Conservée comme **catégorie distincte** — ni
  auto-test (0 élève), ni usage-classe.
- **Demi-groupes** : une **même activité** déployée à **plusieurs groupes de 5 à 15 élèves**, en
  séances espacées de **< 10 jours**, compte pour **un seul usage** (occasion unique). Règle
  générale : tout *run maximal* de séances de la même activité, chacune de **5–15 él.**, à
  gaps consécutifs **< 10 j**, fusionne en **1 occasion**. *(Deux classes pleines > 15 él. de la
  même activité, même rapprochées, restent 2 occasions : c'est un vrai redéploiement.)*

### ⚠️ Deux seuils à NE PAS confondre (point de réconciliation du 23 juin 2026)
- **Usage-classe = séance ≥ 5 él.** — le **seuil canonique** qui sépare « a atteint une classe »
  (escalier niveau ≥ 4) du « sous-seuil » (1-4 él.). Il gouverne la profondeur, la rétention, les
  funnels. **176 profs** (sur 223 ayant touché des élèves) atteignent ce seuil.
- **Séance riche / « classe entière » = séance ≥ 10 él.** — un **mode-cible de qualité pédagogique**
  (une vraie heure en classe complète), **distinct** du seuil canonique. Sert de **KPI** et de
  **prédicteur de profondeur**, **pas** de seuil d'entonnoir. **150 profs** font ≥ 1 séance riche
  (médiane de ces séances : 17 él.).
  - **Grande classe = ≥ 20 él.** (82 profs) : sous-cas du « paradoxe du déployeur ».
  - Quand un rapport écrit « vraie classe / classe entière (≥ 10) », il vise **ce mode-cible** : à
    **nommer** « séance riche / classe entière (≥ 10) », jamais « la classe » tout court (= ≥ 5).

---

## 4. AXE 1 — Profondeur d'usage atteinte dans l'année (escalier exclusif)

Pour un **prof × année scolaire**, on prend le **barreau maximal atteint cette année-là** ; chaque
prof-année tombe dans **un seul** barreau (disjoint par construction). L'escalier est l'**échelle
canonique** ; **chaque monde n'en mesure que la portion qu'il observe** (mondes disjoints, §0) :
- **côté Capytale** (niveaux **2–5**) : implémenté par [`build_profiles.py`](build_profiles.py)
  → `profiles_teacher_year.csv`. ⚠️ **Portée réelle de cette table** : les profs **ayant touché des
  élèves** (niveaux 3-5, 223 profs) **+** les testeurs purs côté Capytale (niveau 2). Les **testeurs
  vus uniquement en formation** (stagiaires, ~140) et le **funnel site** sont ailleurs (ci-dessous).
- **côté site** (niveaux **0–1** : dormant / intention) : population des **2 715 comptes
  mathadata.fr**, mesurée dans la **matrice « porte × profondeur »** du Volet 2 (`site-vers-classe`),
  **pas** dans `profiles_teacher`. Les deux mondes ne se recouvrent que via l'appariement (75 paires).

Autrement dit : **il n'existe pas une table unique listant les 0-5 pour une population unique** —
c'est la conséquence directe des deux mondes disjoints. Un prof apparié est positionné au plus haut
des deux mondes.

| Niv. | Nom court | Définition exacte (dans l'année) | Monde | Statut |
|---|---|---|---|---|
| **0** | **dormant** | compte site existant ; **aucun** clic ressource **ni** usage Capytale | site | mesuré* |
| **1** | **intention** | **≥ 1 clic** vers une ressource/activité (site) ; **aucun** usage Capytale | site | mesuré* |
| **2** | **auto-test** | clone `role=teacher` (test perso) ; **0 élève** distribué | Capytale | mesuré |
| **3** | **usage sous-seuil** | a distribué à des **élèves**, mais **aucune** séance ≥ 5 él. (tous groupes 1–4) | Capytale | mesuré |
| **4** | **usage unique** | exactement **1 occasion** d'usage-classe (1 activité, 1 classe ≥ 5 él. ; demi-groupes fusionnés) | Capytale | mesuré |
| **5** | **usage multiple** | **≥ 2 occasions** d'usage-classe (≥ 2 activités, ou même activité à > 10 j / plusieurs classes pleines) | Capytale | mesuré |

\* *mesuré seulement pour les comptes trackés (créés après ~27 nov 2025) ; pour les comptes
antérieurs, niveaux 0/1 sous-estimés (clics non enregistrés). Toujours préciser « cohorte trackable ».*

**Vocabulaire dérivé** (à employer tel quel partout) :
- **« a enseigné une classe » / « utilisateur-classe »** = niveau **≥ 4** au moins une année.
- **« a touché des élèves »** = niveau **≥ 3** (inclut le sous-seuil).
- **« réutilise (dans l'année) »** = niveau **= 5** *(intra-annuel uniquement — voir l'avertissement §5)*.
- **« testeur seul »** = niveau **= 2** (jamais d'élève).

> 🔴 **RÈGLE ANTI-CIRCULARITÉ (la plus importante).** La **réutilisation** (intensité, axe 1) est
> **strictement intra-annuelle** : elle ne compte **jamais** une activité ou une séance d'une **autre
> année**. Mélanger les deux (« réutilise = … ou l'année suivante ») rend tautologique « ceux qui
> réutilisent reviennent ». Le **retour** (§5) est un concept **séparé**, mesuré entre années.
> *(Défaut historique corrigé : le « 76 % vs 16 % » et le « ≥2 activités » comptés sur la carrière
> entière étaient circulaires — cf. `AUDIT_SYNTHESE_2026.md`.)*

---

## 5. Rétention — relation ENTRE années (jamais dans l'axe 1)

Définie sur l'**usage-classe** (niveau ≥ 4). Soit `Y(prof)` = ensemble des années où le prof atteint
le niveau ≥ 4.

- **Retour consécutif** : ∃ `Y` tel que le prof est utilisateur-classe en **`Y` ET `Y+1`**.
- **Réactivation** : utilisateur-classe en deux années **non consécutives** (ex. `Y` et `Y+2`), sans
  l'année intermédiaire. *(Distinct du retour : reprise après une année de pause.)*
- **Revenu (au sens large)** = retour consécutif **ou** réactivation = utilisateur-classe sur **≥ 2
  années distinctes**. *(C'est la définition employée dans les agrégats « X revenus ».)*
- **Censuré (« trop récent »)** : **première** année d'usage-classe = **2025-2026** → on ne peut pas
  encore observer 2026-2027. **Exclu du dénominateur** des taux de retour (sinon on sous-estime
  mécaniquement). La **cohorte éligible au retour** = profs dont la 1ᵉʳ année classe ≤ 2024-2025.

> Les deux transitions (**retour consécutif** vs **réactivation**) sont **étiquetées séparément**
> dans les diagrammes longitudinaux *(décision du 23 juin 2026)*.

---

## 6. AXE 2 — Canal d'arrivée (origine, attribut FIGÉ)

**Le canal décrit *par quel monde le prof est entré*** en contact avec MathAData. Il est **estimé**
(mondes disjoints) et **figé à la première apparition** : on l'évalue **une seule fois**, à l'instant
du **premier contact daté** (plus ancienne trace tous mondes confondus : création de compte / 1ᵉʳ
clic site, **ou** 1ᵉʳ clone Capytale), puis on le **gèle** pour toutes les années suivantes. Dans un
diagramme de flux, la couleur du ruban = cette racine immuable.

**Deux valeurs seulement** *(décision du 23 juin 2026 — modèle « (ii) » ; le rôle de la formation est
traité à part, §7, pour éviter la redondance avec l'ancien 3ᵉ canal « Formation »)* :

| Canal | Définition exacte (au 1ᵉʳ contact) | Détermination |
|---|---|---|
| **via le site** | il existe une **trace de lui sur mathadata.fr** (compte / clic) **antérieure ou simultanée** à son 1ᵉʳ usage classe | appariement individuel (A/B/D/E), ou trace établissement |
| **Capytale-direct** | au moment de son 1ᵉʳ usage classe, **aucune trace détectable** de lui sur le site | par défaut (négation de l'autre) |

**Capytale-direct** = il a découvert l'activité via le **catalogue Capytale** lui-même (activités
MathAData publiées, clonables par tout prof ENT). S'il crée un compte / clique **après** son 1ᵉʳ
usage, le canal reste *Capytale-direct* (l'origine ne change pas).

> ⚠️ **Borne basse de « via le site ».** Le tracking des clics démarre ~27 nov 2025 → pour un prof
> dont le 1ᵉʳ usage est antérieur, un compte site **non cliqué** (ou cliqué avant le tracking) peut
> être invisible → **sur-attribution à Capytale-direct**. Atténué par la trace établissement et les
> redemptions de formation (couverture historique complète), **pas éliminé**. → canal = **estimé**.

---

## 7. Rôle de la formation (dimension timée, orthogonale au canal)

La formation **n'est plus un canal**. C'est une dimension à part, qui croise n'importe quel canal :

| Statut | Définition |
|---|---|
| **jamais formé** | aucune trace de formation MathAData |
| **formation motrice** | formé **avant ou le jour** de son 1ᵉʳ usage classe → la formation a (plausiblement) **amorcé** l'usage |
| **formation de consolidation** | formé **après** son 1ᵉʳ usage classe → il utilisait déjà ; la formation **renforce** |

- **Formé** = statut site `forme` ∪ `mentor` (binaire). Source : `users.statut` + résolution
  `trainedFormation → formation-codes` (type & date réels).
- **Type de formation** (`fcat`) : `presentiel` / `webinaire` (webdecouv + webinaire) / `nouveau`
  (non formé) / **`ancienne_vague`** (formés avant le système de codes du 15/01/26 — **type & date
  réels INCONNUS**, à ne **pas** compter comme webinaire). *(Détail dans `site-vers-classe/DEFINITIONS_VOLET2.md`.)*
- ⚠️ **Endogénéité** : une formation présentiel dans un établissement déjà adoptant gonfle la
  conversion. Croiser avec l'usage **postérieur** à la formation (au grain établissement). Et
  distinguer deux causes différentes de **0 % d'usage** : (a) le **pré-service STRICT** — master
  **MEEF / INSPÉ** (~13), stagiaires **sans établissement**, 0 % *par construction* (canal à horizon
  décalé, pas un échec) ; (b) une **formation ouverte ratée** — **`ENS_25`** (52) qui n'est **PAS**
  du pré-service (ce sont des **profs en exercice**), son 0 % est un **vrai échec** de formation de
  masse, à compter comme tel. Les deux **diluent** le présentiel, pour des raisons opposées.

---

## 8. Croisements de référence

Les variables canoniques se croisent systématiquement avec :

- **Niveau** : **collège** / **lycée** (via `etablissements.json`, type pour tous les UAI). Un prof
  hérite du type de son UAI de référence (cf. §9).
- **Statut formé** × **timing** (§7).
- **Canal** (§6).
- **Cohorte** = (année, type) de formation, ou année de 1ᵉʳ usage.

---

## 9. Établissement de référence d'un prof

`uai_teach` **modal non vide** ; à défaut, `uai_el` **modal** de ses lignes `role=student` ; à défaut,
`uai_el` modal toutes lignes. *(L'UAI d'un prof « plongée directe » est sur `uai_teach` de ses lignes
élèves — il n'est jamais « absent ».)* Type / secteur / académie / IPS via `annuaire_etablissements.csv`
(99,7 % de correspondance). **IPS** : indice de position sociale (lycées) ; baseline national lycées
≈ 107,0.

---

## 10. Appariement individuel site ↔ Capytale (signaux, rappel)

Confiance signalée. **75 paires** (53 A, 22 B). Sert à déterminer le canal et la formation au grain
individu (sinon : trace établissement).

- **A (haute)** : un user site a cliqué l'activité A à T ; **un seul** compte Capytale `role=teacher` a
  cloné A à `uai_teach == UAI_user` dans `[T-2j, T+60j]`.
- **B (moyenne)** : UAI **1:1** (exactement 1 compte site et 1 compte Capytale-teacher sur cet UAI).
- **D (déploiement)** : récupère les profs « plongée directe » sans clone-test (59 %). Prof réel =
  MD5 `teacher` ayant des élèves ; si un UAI a **1 prof réel et 1 seul compte site ayant cliqué** →
  apparié (A si l'activité recoupe, sinon B).
- **E (déploiement-activité)** : à un UAI multi-comptes, si **une activité** n'a qu'**un** prof réel
  l'ayant déployée et **un** compte site l'ayant cliquée (déploiement après clic) → apparié.

---

## 11. Sécurité (non négociable)

Identifiants et textes libres = **données personnelles**. **Aucune** sortie versionnée ou publiée ne
contient nom / prénom / e-mail (pseudonymes `S####` / `md5[:8]`, grain établissement/commune). Le
snapshot Payload reste **local et gitignore**, jamais committé. Une analyse nominative interne peut
être réalisée sur demande explicite depuis les sources locales autorisées ; elle reste dans
`private/` ou `_local/`, signale la confiance de tout appariement site↔Capytale et n'est jamais
versionnée ni publiée.

---

## Journal des décisions de définition

- **2026-06-23** — Refonte canonique : (1) seuil classe **≥ 10 → ≥ 5** + bande **sous-seuil 1-4**
  explicite ; (2) **axe profondeur 0-5** (escalier exclusif) ; (3) **canal réduit à 2 valeurs**
  (*via le site* / *Capytale-direct*), **figé** à la 1ᵉʳ apparition ; (4) **formation = dimension
  timée** (motrice / consolidation / jamais), plus un canal ; (5) **réutilisation strictement
  intra-annuelle** (anti-circularité) ; (6) **retour consécutif** et **réactivation** étiquetés
  séparément. Implémentation : `transverse/build_profiles.py`.
