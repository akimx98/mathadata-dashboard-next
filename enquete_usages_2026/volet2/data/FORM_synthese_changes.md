# Volet 2 — Intégration des données de formation (mathadata.fr × Capytale)

Les nouvelles collections de formation (`formation-codes` 45 sessions, `formation-redemptions` 239 validations, `modules`, `etablissements`) permettent un **typage réel** des 631 enseignants formés et un croisement intention-déclarée × usage-réel. Elles confirment l'essentiel du Volet 2 v1, en affinent la lecture, et en corrigent deux points structurants. Tous les chiffres ci-dessous ont fait l'objet d'une re-vérification adverse indépendante depuis les données brutes (18/20 affirmations centrales reproduites à l'identique ou à un cas-limite près).

---

## 1. CONCLUSION v1 → STATUT → formulation v2

| # | Conclusion v1 | Statut | Formulation v2 (groundée) |
|---|---|---|---|
| 1 | « La formation multiplie le clic Capytale par ~2,6 » | **Affinée** | L'effet existe mais se décompose selon le type réel. Clic Capytale : nouveau 9,0 % / présentiel 26,2 % / webinaire 24,8 % / ancienne vague 17,0 %. Le ×2,6 agrégé masque que le moteur n'est pas « la formation » en bloc mais sa **nature** (cf. enseignement 1). |
| 2 | « Le webinaire convertit mieux en classe que le présentiel (31 % vs 24 %) » | **Corrigée** | Artefact de typage. En v1, les 147 « ancienne vague » (formés avant le système de codes, type inconnu) étaient comptés à tort en `webdecouv`, gonflant le webinaire. Avec le typage réel : webinaire 32,4 %, présentiel 23,4 %. L'écart subsiste mais (a) il est moins net après déduplication établissement (webinaire 29,5 % vs présentiel 17,1 %), et surtout (b) le format n'est **pas** la variable explicative — c'est la concentration (cf. enseignement 1). Le présentiel agrégé est tiré vers le bas par le pré-service et les journées académiques dispersées. |
| 3 | « Endogénéité présentiel : 10/27 établissements déjà acquis » | **Confirmée (affinée)** | Avec les vraies dates de formation : sur 26 UAI présentiels à usage élève, **9 utilisaient Capytale AVANT la formation** (17 après). La formation ne peut donc pas être créditée de ~35 % de l'usage présentiel observé. À maintenir comme limite causale forte : **ne pas présenter le présentiel comme causal**. |
| 4 | « Délai formation → usage ~2 semaines » | **Corrigée** | Délai formation → 1re séance élève (vraies dates, UAI distincts) : **médiane 27 jours** (p25 12, p75 71). L'inertie réelle est de l'ordre du mois, pas de la quinzaine. Cohérent avec le délai validation→usage des intentions réalisées (médiane 34 j). |
| 5 | « Présentiel = amorçage large, webinaire = approfondissement » | **Corrigée** | Le clivage pertinent n'est pas format → fonction, mais **concentration**. Le présentiel recouvre deux régimes opposés : établissement-ciblée (67,5 % d'aboutissement) et académique de masse (12,6 %). Le « webinaire = approfondissement » ne tient pas : c'est une nature à part (distanciel, 32,4 %), ni amorçage ni approfondissement assignable. |
| 6 | « Cohortes récentes 2026 sous-converties par récence » | **Corrigée** | La maturité ne prédit pas l'aboutissement. Les deux meilleures cohortes (Gif 32 j, Arpajon 39 j) sont parmi les **plus récentes** ; des cohortes mûres (Narbonne 88 j, St-Brieuc 156 j) restent < 12 %. Cohortes ≥ 60 j : ~20–23 % ; < 60 j : ~30–34 %. La récence n'est pas l'excuse ; la nature est le prédicteur. |

> Effet formation, source de vérité (typage réel) : **usage classe** nouveau 17,8 % / présentiel 23,4 % / webinaire 32,4 % / ancienne vague 28,6 % ; **clic Capytale** 9,0 / 26,2 / 24,8 / 17,0 ; **ressources moy.** 2,05 / 4,04 / 10,17 / 4,56. Au niveau établissement dédupliqué : 14,7 / 17,1 / 29,5 / 25,8 % (hiérarchie inchangée).

---

## 2. Enseignements nouveaux — que seules les données de formation révèlent

**1. Le prédicteur d'aboutissement en classe est la CONCENTRATION de la formation, pas son format.** En reclassant les 39 cohortes documentées par *nature* (qui était dans la salle), l'écart va de 1 à ~5 : formation **établissement-ciblée** (plusieurs collègues d'un même lieu, autour d'un projet local — Gif, Lille 2024, Calais, Amiens, Montpellier_25) → **67,5 %** d'aboutissement ; formation **académique de masse** (IREM, Labomaths, APMEP, journées académiques, ~1 prof dispersé par établissement) → **12,6 %**. Or les deux sont du présentiel et affichent 23,4 % en moyenne agrégée : une moyenne qui mélange deux régimes opposés. *Réserve : la frontière de classification (mots-clés + ratio profs/UAI < 1,5) est subjective ; après déduplication établissement l'écart reste fort (60,0 % vs 9,6 %) mais le chiffre exact est fragile — à présenter comme ordre de grandeur robuste.*

**2. Un cinquième de l'effort de formation présentielle vise un public structurellement incapable d'aboutir en classe : le pré-service.** **74 des 363 profs présentiels (20,4 %)** sont des stagiaires. Les deux vraies cohortes pré-service — **ENS_25 (52 profs)** et **MEEF INSPÉ Paris (13)** — totalisent 65 stagiaires, ~5 UAI distincts et **0 % d'usage classe** : sans établissement ni élèves, elles ne *peuvent* pas produire d'usage cette année. C'est moins une distorsion du taux qu'un **mauvais ciblage de l'investissement**. *Nuance : la 3e cohorte rangée en pré-service (INSPÉ continue 26/11, 9 profs) affiche 100 % (2/2) — le « structurellement 0 % » ne vaut strictement que pour ENS_25 + MEEF.*

**3. L'intention déclarée est un signal d'engagement, pas un prédicteur d'usage.** Sur 239 validations, seules **29 (12 %)** déclarent ≥ 1 module (32 % « pas d'idée », 56 % vide). Les 29 déclarent 99 modules (3,4 chacun, ils cochent large, distribution plate sur tout le catalogue 2nde/1re). **6/99 intentions** seulement se réalisent (même activité dans l'UAI), portées par **3 profs sur 29**. Mais ce 6 % n'est pas un échec de ciblage : **85/93 intentions non réalisées émanent d'établissements n'ayant déclenché AUCUN Mathadata sur Capytale**. Le goulot n'est pas le choix du module, c'est le **passage à l'acte en classe** — aggravé par la récence (validations 2026, usages souvent à venir). À noter : la validation se fait **en séance** (238/239 dans les 24 h de la formation) → acte de formation, pas de planification.

**4. Le module « Intro IA » est invisible dans l'intention mais central dans l'usage.** Déclaré **0 fois** (car `hiddenOnSite`, absent du formulaire), il est pourtant la **2e activité la plus utilisée** sur Capytale. L'intention déclarée ne couvre donc pas le périmètre réel — angle mort à corriger si l'on veut piloter par l'intention.

**5. L'« ancienne vague » n'est pas un noyau de pionniers, mais un profil mêlé à maturité moyenne.** Les 147 formés avant le 15/01/2026 (placeholders 1984, sans redemption) affichent 28,6 % d'usage classe — au-dessus des nouveaux (17,8 %) mais sous le webinaire (32,4 %) ; clic 17,0 %, ressources 4,6. **75/147 ont créé leur compte en janvier 2026** (régularisation tardive), seuls **35/147 ont un UAI** et 41 ont une séance. Leur sur-usage vs « nouveaux » tient à leur **maturité** (plus de temps écoulé), pas à un engagement intrinsèque hors norme.

**6. La multi-formation est quasi inexistante.** **Un seul** professeur cumule deux validations. Le dispositif ne produit pas (encore) de parcours formation présentiel → webinaire d'approfondissement : le « parcours » imaginé en v1 n'a pas de réalité statistique.

---

## 3. Recommandations actualisées

1. **Prioriser les formations établissement-ciblées.** Le facteur ~5 d'aboutissement (67,5 % vs 12,6 %) est le levier le plus net. Former 3-4 collègues d'un même établissement autour d'un projet local convertit massivement mieux que les journées académiques dispersées. Réorienter une part de l'effort « masse » vers le ciblage établissement.

2. **Traiter le pré-service comme un canal distinct, à horizon décalé.** Ne plus diluer le taux présentiel avec ENS_25 / MEEF : les compter à part, avec un suivi à T+1 an (première titularisation / premier établissement), et un objectif d'engagement (pas d'usage classe immédiat). 20 % de l'effort présentiel mérite un indicateur dédié.

3. **Déplacer le KPI de l'intention vers le passage à l'acte.** L'intention déclarée (6/99 réalisées) ne pilote rien à court terme. Suivre plutôt le **délai médian formation→1re séance (~27-34 j)** et relancer activement les profs formés dont l'établissement n'a rien déclenché à J+45 (85/93 intentions bloquées là). Rendre le module Intro IA visible dans le formulaire pour aligner intention et usage réel.

4. **Ne pas attribuer l'usage présentiel à la formation sans correction d'endogénéité.** 9/26 succès présentiels précèdent la formation. Tout reporting d'« effet formation » doit isoler les établissements déjà actifs, sous peine de surestimer l'impact d'environ un tiers.

---

## 4. Limites et flags consolidés

- **Piège de libellé « UAI ».** Les comptages `(27/40 UAI)`, `(21/167 UAI)`, `(22/68 UAI)` et la colonne `n_uai` de `cohorts.csv` comptent en réalité des **profs-ayant-un-UAI**, pas des établissements distincts (ex. Gif : « 13 UAI » pour 3 établissements réels). Au niveau établissement dédupliqué les taux baissent (usage classe 14,7 / 17,1 / 29,5 / 25,8 % ; établissement-ciblée 60,0 % / masse 9,6 %). **La hiérarchie et le facteur ~5-6 tiennent dans les deux conventions**, mais les libellés doivent dire « profs avec établissement renseigné ».
- **Typologie « nature » subjective.** L'écart établissement-ciblée vs masse repose sur une règle de classification (mots-clés + seuil profs/UAI). Des cas borderline (Arpajon, 76,9 %, concentré sur 2 établissements mais rangé en « masse ») portent une part du facteur. Direction robuste, **chiffre exact fragile** → ordre de grandeur.
- **Couverture redemptions limitée à 2026.** Les 239 validations datent toutes du ≥ 15/01/2026 ; beaucoup visent un usage encore à venir (jusqu'à janvier 2027). Le 6/99 d'intentions réalisées est plombé par la récence, **pas interprétable comme taux d'échec définitif**.
- **Placeholders 1984.** Les 147 « ancienne vague » (2 codes placeholder, date bidon 1984-01-01) ont type et date **inconnus** : tout chiffre les concernant (28,6 % usage, maturité) est à manier avec réserve. Effectif réellement exploitable : 35 avec UAI, 41 avec séance.
- **Petits effectifs partout sur le fin.** Intention : 29 déclarants, 3 réalisateurs. Pré-service productif : 2/2. Maturité par cohorte : 5 à 12 cohortes ≥ 5 profs-UAI. Les chiffres « maturité ≥60 j 23,0 % / <60 j 34,5 % » ne se reproduisent pas exactement (recalcul : 19,9 % / 29,5 %) — **conclusion qualitative valide, pourcentages à ne pas sur-interpréter**.
- **Endogénéité non éliminée.** 9/26 succès présentiels précèdent la formation : la causalité du présentiel reste non établie.

Fichier également écrit : `/private/tmp/claude-502/-Users-akim-Documents-MathAData-Git-mathadata-dashboard-next/49f4f306-c2bb-43a0-af8f-f1b5ce99e908/scratchpad/volet2_v2_integration.md`