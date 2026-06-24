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

L'extraction Capytale est obtenue en appelant **l'API de Capytale** (donnée déjà **pseudonymisée** —
aucune PII). Elle est **indépendante** du snapshot Payload : pas besoin du dépôt site ni d'accès
Payload pour la régénérer.

- **Endpoint** : `https://capytale2.ac-paris.fr/web/c-stat/mathadata` (override possible par la variable
  d'environnement `CAPYTALE_MATHADATA_URL`).
- **Authentification** : en-tête `Authorization: Bearer <token>`, `Accept: text/csv`.
- La **même logique** alimente l'app Next.js du dashboard ([`app/api/csv/route.ts`](../app/api/csv/route.ts),
  bouton « synchroniser Capytale ») — c'est la source de vérité de l'appel.

### Le token API (à faire une fois)

Le token se nomme **`CAPYTALE_MATHADATA_TOKEN`** et vit dans le fichier **`.env.local` à la racine du
dépôt** (`.env.local` est **gitignore** — le token n'est jamais committé).

1. Récupérer le token dans le **trousseau du Drive MathAData** (keychain partagé de l'équipe).
2. L'ajouter à son `.env.local` (le créer s'il n'existe pas), une ligne :

   ```
   CAPYTALE_MATHADATA_TOKEN=collez_le_token_ici
   ```

### Récupérer une extraction fraîche (script fourni)

```bash
python3 enquete_usages_2026/fetch_capytale.py
```

Le script lit le token depuis `.env.local` (jamais affiché), appelle l'API, **valide les 12 colonnes**,
normalise (`role` en minuscule, `NULL` → vide) et écrit, **sans écraser** :

```text
public/data/capytale_fresh_<AAAAMMJJ>.csv
```

### Promouvoir cette extraction en référence de l'enquête

1. **Pointer les scripts** sur le nouveau fichier (remplacer `capytale_fresh_20260619.csv`) :
   `usage-capytale/build_canonical.py`, `usage-capytale/build_teachers_v2.py`,
   `usage-capytale/compute_facts.py`, et la valeur citée dans `usage-capytale/DEFINITIONS.md`.
2. Relancer la chaîne : `bash enquete_usages_2026/rebuild_all.sh`, puis vérifier que
   `transverse/check_contracts.py` finit par `✅`. ⚠️ Les **populations attendues** (`K.EXPECT` dans
   `enquete_common.py`) sont ancrées sur l'extraction actuelle : une nouvelle extraction les fera bouger
   → mettre à jour `K.EXPECT` **consciemment** (c'est le rôle des contrats de forcer cette revue).
