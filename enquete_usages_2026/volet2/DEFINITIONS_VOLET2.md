# Définitions canoniques — VOLET 2 : croisement mathadata.fr × Capytale (extraction 2026-06-20)

Ce volet relie deux mondes sans clé commune :
- **Capytale** (usage en classe, **anonyme**, comptes ENT pseudonymisés) — déjà analysé au Volet 1.
- **mathadata.fr** (parcours amont, **nominatif**, snapshot Payload) — nouveau.

## Fichiers
- Snapshot site (PII, **gitignore**, ne jamais committer) : `mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z/`
  (`users.json` 2724, `sessions.json` 25908, `events.json` 24683, `consultation_rss.json` 13197 ; `README.md` = dictionnaire).
- Usage Capytale : `public/data/capytale_fresh_20260619.csv` (cf. Volet 1).
- Sorties versionnées (agrégats, **sans PII**) : `enquete_usages_2026/volet2/data/`
  - `facts_cross.json` — **source de vérité** des chiffres du croisement.
  - `capytale_by_uai_teach.csv`, `capytale_by_uai_el.csv`, `presentiel_etabs.csv`.
  - `match_candidates.csv` (pseudonymisé : site=`S####`, Capytale=md5[:8]), `match_validation.json`.
- Travail nominatif-dérivé (id payload sans nom/email) → **scratchpad** uniquement.

## LE PONT (découverte clé)
`consultation_rss.file == "capytale2.ac-paris.fr/web/b/<id>"` ⟹ `<id> == mathadata_id` côté Capytale.
Idem `events.resource_download` `resourceType=="capytale"`. Donc un **clic nominatif** sur le site se relie à une **activité Capytale précise, datée**. C'est le seul lien direct site→Capytale (mais s'arrête au clic : le clonage ENT sur Capytale reste anonyme).

## Garde-fou tracking (IMPÉRATIF)
Le tracking clics/sessions/events ne commence que **~27 nov 2025**. Conséquences :
- Les métriques de clic (`clicked_cap`, `active`, profondeur de consultation) **sous-estiment** l'usage des comptes plus anciens → toujours préciser « toutes dates » vs **cohorte trackable** (comptes créés après le 27 nov 2025).
- La conversion au **grain établissement** (un UAI a-t-il un usage ÉLÈVE Capytale ?) s'appuie sur l'**historique Capytale complet 2023→2026** : **non biaisée**. C'est le proxy d'aboutissement « jusqu'à la classe ».

## Collections de formation (ajout du 20 juin 2026, 2ᵉ chargement)
Quatre collections sont arrivées et remplacent l'inférence par les vraies données :
- **`formation-codes.json`** (45) : 1 ligne = 1 session de formation. `id`, `label` (nom réel : `202410_LILLE`, `ENS_25`, `Web Basque 27 nov 2025`, `MEEF INSPÉ Paris`…), `typeFormation` (`presentiel` 22 / `webdecouv` 21 / `webinaire` 2), `formationDate` (vraie date, 2024-10 → 2026-09), `disabled`, `participants[]` (épars, 79 — **ne pas** utiliser comme roster).
- **`formation-redemptions.json`** (239) : validations. `user`, `code`→code, `formationDate`, `intention.modules` (modules déclarés). Couvre surtout **2026** ; 236 users distincts, 1 seul avec 2 validations.
- **`modules.json`** (7) : `id`→nom. **Mapping module→activité Capytale** : 1=Stat(3518185), 2=Équation réduite(3515488), 3=Repère/milieu/distance(6659633), 4=Stat fœtus(6944347), 5=1ʳᵉ produit scalaire(5862412), 6=2nde vecteur directeur(8790616), 7=Intro IA(2548348).
- **`etablissements.json`** (13 040) : `uai`→{`nom`,`ville`,`academie`,`type`(college 7655 / lycee 5385)}. **Type tous les UAI** (corrige les établissements non typés du Volet 2 v1).

### Typage formation RÉEL (remplace `trainedTypeFormation` brut)
Résoudre `users.trainedFormation` → `formation-codes.id` → type/date/label réels. **4 catégories (`fcat`)** :
- `nouveau` (2084), `presentiel` (363), `webinaire` (121 = webdecouv+webinaire genuine), **`ancienne_vague` (147)**.
- **CORRECTION DE FOND** : les 147 `ancienne_vague` = formés **avant le système de codes (15/01/26)**, regroupés dans 2 codes placeholder à date bidon `1984-01-01` (labels « Tous les anciens formés… » / « A classer »), **type & date réels INCONNUS**. Le Volet 2 v1 les comptait à tort comme `webdecouv`/webinaire → gonflait l'usage du webinaire. Désormais **séparés**.
- **Nature ≠ type** : sous le `presentiel` se cachent des cohortes **pré-service** (`ENS_25` 52, `MEEF INSPÉ` 13 — stagiaires sans établissement, 0 % d'usage classe possible) qui **diluent** le présentiel. Distinguer pré-service / établissement-ciblée / académique-de-masse / distanciel.

## Modèle des comptes site
- `statut` : `nouveau` / `forme` / `mentor`. Binaire : **formé = forme ∪ mentor** (631 hors 9 exclus).
- `trainedDateFormation` (virtuel) avait une **sentinelle bidon `1984-01-01`** (149 cas) → désormais résolue via `formation-codes` (vraie date pour les cohortes datées ; reste inconnue pour `ancienne_vague`).
- `newsletter_only` (1003) : compte créé via le seul formulaire newsletter (repasse à `false` à la 1ʳᵉ authentification). **Comptes complets** = 1721.
- `exclude_from_analytics` (9) : comptes équipe/test → **exclure** des KPI.
- `uai` renseigné pour 803 comptes seulement ; `academie` pour 1749. Normaliser les académies (accents : `Créteil`≡`Creteil`).

## Règles métier du croisement
- **Compter les profs (PIÈGE à connaître)** : un prof = un MD5 `teacher` distinct ayant ≥1 ligne `role=student`. **59 % des profs (133/224) n'ont aucune ligne `role=teacher`** : ils distribuent directement à leurs élèves sans se créer de clone de test (« plongée directe »). Conséquence : les colonnes `n_teacher_clones` / `n_teacher_accounts` de `capytale_by_uai_*.csv` ne comptent **que** ces clones de test et valent **0 pour 83 des 153 UAI** ayant pourtant de vrais profs+élèves. **Ne JAMAIS** les lire comme « nombre de profs à l'établissement » → pour ça, `distinct(teacher)` sur les lignes `role=student` (l'UAI du prof est sur `uai_teach` de ses lignes élèves, pas absent). Ces deux colonnes ne sont d'ailleurs reconsommées par aucune analyse (sûr).
- **Effet formation** : comparer `nouveau` / `formé-presentiel` / `formé-webdecouv` sur (`%clic Capytale`, `%actif`, `%établissement-avec-usage-élève`, `ressources moyennes`). Le signal d'aboutissement non biaisé = **% dont l'UAI a un usage élève Capytale** (historique complet). Attention à l'**endogénéité** : une formation présentiel donnée dans un établissement déjà adoptant gonfle la conversion → croiser avec `usage_after_formation` (présentiel par établissement).
- **Deux portes** (grain UAI) :
  - **Capytale-direct** = UAI avec usage Capytale **sans aucun compte site** déclarant cet UAI (borne basse ; un prof peut avoir un compte sans déclarer l'UAI). ≈ 77 / 174 (44 %).
  - **Site-only** = UAI déclaré côté site **sans trace classe Capytale**. ≈ 511 / 618 (83 %).
- **Cohorte de formation** = (mois, type) de `trainedDateFormation` ; pour le présentiel, l'**établissement** ancre un quasi-expérimentation.
- **Appariement individuel** (bonus, confiance signalée) :
  - **A (haute)** : un user site a cliqué l'activité A à T ; **un seul** compte Capytale `role=teacher` a cloné A à `uai_teach == UAI_user` dans `[T-2j, T+60j]`.
  - **B (moyenne)** : UAI **1:1** (exactement 1 compte site et 1 compte Capytale-teacher sur cet UAI).
  - **D (déploiement)** : récupère les profs « plongée directe » sans clone-test (59 % des profs). Prof réel = MD5 `teacher` ayant des élèves ; si un UAI a **exactement 1 prof réel et 1 seul compte site ayant cliqué** une activité Capytale → apparié (A si l'activité cliquée recoupe une activité déployée, sinon B). Sans ce signal, A/B (basés sur `role=teacher`) rataient tous les plongeurs-directs.
  - **67 paires** (44 A, 23 B), calibrées sur le hub fondateur (Haubourdin) et les UAI 1:1.

## Chiffres-clés (cf. facts_cross.json, à la date d'extraction)
- Funnel : 2724 comptes → 1721 complets → 638 formés → 337 ont cliqué vers Capytale → (Volet 1) 224 ont enseigné / 5854 élèves.
- Effet formation : %clic Capytale 9,0 (nouveau) → 23,5 (formés) ; %établissement-avec-usage 17,8 → 26,0 ; ressources moy. 2,1 → 5,3 (webinaire 7,0).
- Présentiel par établissement : 154 établissements, 17,5 % avec usage Capytale, 11 % avec usage **postérieur** à la formation (fort plafond de récence).

## Sécurité
Identifiants et textes libres = **données personnelles**. Aucune sortie versionnée/publiée ne contient nom/prénom/email. Pas de ré-identification. Le snapshot reste local (gitignore).
