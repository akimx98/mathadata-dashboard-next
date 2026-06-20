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

## Modèle des comptes site
- `statut` : `nouveau` (2086) / `forme` (637) / `mentor` (1). Pour l'analyse binaire : **formé = forme ∪ mentor** (638).
- `trainedTypeFormation` : **`presentiel`** (366, formation en établissement) / **`webdecouv`** (270, webinaire découverte). 2 formés sans type.
- `trainedDateFormation` : date de la **session** de formation. **Sentinelle bidon `1984-01-01T12:00:00Z`** (149 cas `webdecouv`) ⟹ traiter comme **manquante**.
- `newsletter_only` (1003) : compte créé via le seul formulaire newsletter (repasse à `false` à la 1ʳᵉ authentification). **Comptes complets** = 1721.
- `exclude_from_analytics` (9) : comptes équipe/test → **exclure** des KPI.
- `uai` renseigné pour 803 comptes seulement ; `academie` pour 1749. Normaliser les académies (accents : `Créteil`≡`Creteil`).

## Règles métier du croisement
- **Effet formation** : comparer `nouveau` / `formé-presentiel` / `formé-webdecouv` sur (`%clic Capytale`, `%actif`, `%établissement-avec-usage-élève`, `ressources moyennes`). Le signal d'aboutissement non biaisé = **% dont l'UAI a un usage élève Capytale** (historique complet). Attention à l'**endogénéité** : une formation présentiel donnée dans un établissement déjà adoptant gonfle la conversion → croiser avec `usage_after_formation` (présentiel par établissement).
- **Deux portes** (grain UAI) :
  - **Capytale-direct** = UAI avec usage Capytale **sans aucun compte site** déclarant cet UAI (borne basse ; un prof peut avoir un compte sans déclarer l'UAI). ≈ 77 / 174 (44 %).
  - **Site-only** = UAI déclaré côté site **sans trace classe Capytale**. ≈ 511 / 618 (83 %).
- **Cohorte de formation** = (mois, type) de `trainedDateFormation` ; pour le présentiel, l'**établissement** ancre un quasi-expérimentation.
- **Appariement individuel** (bonus, confiance signalée) :
  - **A (haute)** : un user site a cliqué l'activité A à T ; **un seul** compte Capytale `role=teacher` a cloné A à `uai_teach == UAI_user` dans `[T-2j, T+60j]`.
  - **B (moyenne)** : UAI **1:1** (exactement 1 compte site et 1 compte Capytale-teacher sur cet UAI).
  - 46 paires (29 A, 17 B), calibrées sur le hub fondateur (Haubourdin) et les UAI 1:1.

## Chiffres-clés (cf. facts_cross.json, à la date d'extraction)
- Funnel : 2724 comptes → 1721 complets → 638 formés → 337 ont cliqué vers Capytale → (Volet 1) 224 ont enseigné / 5854 élèves.
- Effet formation : %clic Capytale 9,0 (nouveau) → 23,5 (formés) ; %établissement-avec-usage 17,8 → 26,0 ; ressources moy. 2,1 → 5,3 (webinaire 7,0).
- Présentiel par établissement : 154 établissements, 17,5 % avec usage Capytale, 11 % avec usage **postérieur** à la formation (fort plafond de récence).

## Sécurité
Identifiants et textes libres = **données personnelles**. Aucune sortie versionnée/publiée ne contient nom/prénom/email. Pas de ré-identification. Le snapshot reste local (gitignore).
