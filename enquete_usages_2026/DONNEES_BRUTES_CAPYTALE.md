# Donnée brute Capytale — schéma & provenance

Source d'usage **en classe**, **anonyme** (comptes ENT pseudonymisés), couvrant **2023→2026**.
C'est l'une des deux entrées brutes de l'enquête (l'autre = snapshot Payload, nominatif & local ;
cf. [`MISE_A_JOUR_DONNEES.md`](MISE_A_JOUR_DONNEES.md)).

- **Fichier de référence (versionné)** : `public/data/capytale_fresh_20260619.csv` (extraction du 19/06/2026).
- **PII** : aucune. Les comptes sont des identifiants pseudonymisés (hash). Versionnable sans risque.
- **Sémantique des champs & pièges** : voir [`usage-capytale/DEFINITIONS.md`](usage-capytale/DEFINITIONS.md)
  (rôle = type de compte, reconstruction des séances, établissement du prof) et le
  [`GLOSSAIRE.md`](transverse/GLOSSAIRE.md) pour les définitions canoniques.

## Schéma (1 ligne = 1 affectation / clone)

| Colonne | Sens |
|---|---|
| `assignment_id` | identifiant de l'affectation (le clone) |
| `created` | date de création — **epoch UNIX en secondes, UTC** (converti en Europe/Paris dans le pipeline) |
| `changed` | date de dernière modification (même format) |
| `assignment_title` | titre donné à l'affectation |
| `student` | **compte propriétaire du clone** : un vrai élève si `role=student` ; un **prof-stagiaire** (clone-owner d'une formation) si `role=teacher` |
| `role` | **type du compte**, pas la position : `student` (vrai élève) / `teacher` (compte enseignant) / vide (à exclure des KPI fins) |
| `uai_el` | UAI côté propriétaire du clone (`student`) |
| `activity_id` | identifiant Capytale de l'activité clonée |
| `teacher` | **compte distributeur** (le prof qui distribue, ou le formateur) — c'est l'« identité prof » pour compter les profs (`distinct(teacher)` sur lignes `role=student`) |
| `uai_teach` | UAI côté distributeur |
| `mathadata_id` | identifiant de l'**activité-maître** MathAData (ce qui est cloné) — sert de pont vers le site (`web/b/<mathadata_id>`) |
| `mathadata_title` | titre de l'activité-maître |

> ⚠️ Pièges canoniques (détaillés dans `usage-capytale/DEFINITIONS.md` / `GLOSSAIRE.md`) : ne JAMAIS
> compter les profs via `n_teacher_clones` ; un prof en formation reste `role=teacher` (jamais élève) ;
> isoler le **hub fondateur** (`cfcd2084…`, MD5 « 0 ») et exclure le **compte démo** (`c81e728d…`, « 2 »).

## Provenance & rafraîchissement

L'extraction Capytale est obtenue en appelant **l'API de Capytale** (la donnée renvoyée est déjà
pseudonymisée — aucune PII). Elle est **indépendante** du snapshot Payload : pas besoin du dépôt site
ni d'accès Payload pour la régénérer.

Pour mettre à jour l'usage Capytale de référence :

1. Appeler l'API Capytale pour produire une extraction au **même schéma** que le tableau ci-dessus
   (mêmes colonnes, même pseudonymisation — aucune PII).
2. La déposer sous `public/data/` (nom daté, ex. `capytale_fresh_AAAAMMJJ.csv`) et **mettre à jour le
   chemin** dans les scripts qui lisent l'entrée de référence (`usage-capytale/build_canonical.py`,
   `build_teachers_v2.py`, et la valeur par défaut citée dans `usage-capytale/DEFINITIONS.md`).
3. Relancer la chaîne : `bash enquete_usages_2026/rebuild_all.sh` puis vérifier les contrats.

> 📝 **À compléter** : l'**appel API exact** (endpoint, authentification, paramètres, mapping des
> champs renvoyés vers le schéma ci-dessus) n'est pas encore versionné ici. Le consigner — idéalement
> sous forme d'un petit script d'extraction dans `enquete_usages_2026/` — rendrait le rafraîchissement
> Capytale pleinement reproductible par un collègue.
