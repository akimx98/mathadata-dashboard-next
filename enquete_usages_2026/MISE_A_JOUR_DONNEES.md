# Mettre à jour les données de l'enquête

Ce guide couvre les deux entrées brutes :

- le snapshot Payload de `mathadata.fr`, nominatif et strictement local ;
- l'extraction CSV Capytale, pseudonymisée et versionnée dans ce dépôt.

## Prérequis

- accès au dépôt privé `mathadata/mathadata-website` ;
- compte administrateur Payload sur `https://mathadata.fr` ;
- clone de `mathadata-dashboard-next` et clone de `mathadata-website` disponibles localement ;
- Node.js pour le snapshot Payload, Python 3 pour les analyses.

Les exemples supposent que les deux dépôts sont voisins :

```text
MathAData_Git/
├── mathadata-dashboard-next/
└── mathadata-website/
```

## 1. Récupérer un snapshot Payload complet

Le script requis est `src/scripts/snapshotPayloadToLocal.mjs` dans le dépôt
`mathadata-website`. Il exporte les huit collections nécessaires :

```text
users
sessions
events
consultation_rss
formation-codes
formation-redemptions
modules
etablissements
```

### ⚠️ La source = la PRODUCTION (`mathadata.fr/admin`), pas ta base locale

Le script se connecte à `REMOTE_PAYLOAD_URL=https://mathadata.fr` et s'**authentifie avec un compte
admin Payload de PRODUCTION** (`mathadata.fr/admin`) pour lire les collections via l'API REST. Donc :

- **Ni la branche du clone site, ni sa base de données locale ne déterminent les données** — seuls
  comptent l'URL de prod + les identifiants admin. (La base locale `DATABASE_URI` ne sert qu'à l'étape
  *optionnelle* d'import Postgres local, **inutile** à l'enquête.)
- Il te faut un **compte administrateur sur `mathadata.fr/admin`**.

### La branche du dépôt site n'a pas d'importance

Le script `src/scripts/snapshotPayloadToLocal.mjs` est présent **sur `master` ET sur `dev`** (le commit
qui l'a introduit, `4b4eed45`, est mergé sur master). Il suffit que ton clone soit **à jour** ; lance-le
depuis la branche où tu es, sans worktree ni checkout particulier :

```bash
SITE_REPO="/chemin/vers/mathadata-website"
git -C "$SITE_REPO" pull --ff-only      # mettre le clone à jour (master ou dev, peu importe)
```

### Lancer le snapshot

```bash
SITE_REPO="/chemin/vers/mathadata-website"

read -r -p "E-mail admin Payload (PROD) : " REMOTE_ADMIN_EMAIL
read -r -s -p "Mot de passe admin Payload (PROD) : " REMOTE_ADMIN_PASSWORD
printf '\n'

REMOTE_PAYLOAD_URL="https://mathadata.fr" \
REMOTE_ADMIN_EMAIL="$REMOTE_ADMIN_EMAIL" \
REMOTE_ADMIN_PASSWORD="$REMOTE_ADMIN_PASSWORD" \
node "$SITE_REPO/src/scripts/snapshotPayloadToLocal.mjs" --limit 5000

unset REMOTE_ADMIN_EMAIL REMOTE_ADMIN_PASSWORD
```

Le snapshot est écrit par défaut dans `mathadata-website/private/payload-snapshots/<timestamp>/`
(les 8 collections en `.json`).

> **Repli** (clone trop ancien dont la branche courante ne contient pas encore le script, sans vouloir
> changer de branche) : lancer depuis un worktree détaché —
> `git -C "$SITE_REPO" worktree add --detach /tmp/site-snap 4b4eed45`, exécuter le script depuis
> `/tmp/site-snap/src/scripts/...` avec `--output-root "$SITE_REPO/private/payload-snapshots"`, puis
> `git -C "$SITE_REPO" worktree remove /tmp/site-snap`.

Ne jamais passer `--since` pour produire la source complète d'une enquête : cette option
limite volontairement les collections historiques. Elle est destinée aux diagnostics
ponctuels, pas à une reconstruction exhaustive.

## 2. Lancer les analyses avec ce snapshot

Depuis `mathadata-dashboard-next` :

```bash
SNAPSHOT="/chemin/vers/mathadata-website/private/payload-snapshots/<timestamp>"

test -f "$SNAPSHOT/users.json"
test -f "$SNAPSHOT/formation-codes.json"
test -f "$SNAPSHOT/etablissements.json"

MATHADATA_SNAPSHOT="$SNAPSHOT" \
bash enquete_usages_2026/rebuild_all.sh
```

Le chemin explicite `MATHADATA_SNAPSHOT` est obligatoire pour une nouvelle extraction :
plusieurs scripts ont encore un ancien snapshot daté comme valeur par défaut.

Le pipeline écrit ses tables de travail locales dans `enquete_usages_2026/_local/`,
également ignoré par Git.

## 3. Sécurité et partage

Le snapshot contient notamment noms, prénoms, e-mails, établissement et textes libres.
Il est ignoré par Git et ne doit être :

- ni committé dans `mathadata-dashboard-next`, qui est public ;
- ni committé dans `mathadata-website`, même si ce dépôt est privé ;
- ni copié dans une page publiée ou une pièce jointe non contrôlée.

Chaque collègue autorisé génère son snapshot avec son propre compte administrateur.
Les sorties versionnées de l'enquête doivent rester agrégées ou pseudonymisées et passer
les contrats de sécurité de `transverse/check_contracts.py`.

## 4. Capytale

L'extraction Capytale est **indépendante** du snapshot Payload (donnée pseudonymisée, aucune PII).
Elle s'obtient via l'**API Capytale** avec un script fourni :

```bash
# token CAPYTALE_MATHADATA_TOKEN dans .env.local (racine), récupéré au trousseau du Drive MathAData
python3 enquete_usages_2026/fetch_capytale.py     # → public/data/capytale_fresh_<AAAAMMJJ>.csv
```

Puis relancer toute la chaîne sur ce fichier, sans modifier les scripts :

```bash
export MATHADATA_CAPYTALE_CSV="$PWD/public/data/capytale_fresh_<AAAAMMJJ>.csv"
export MATHADATA_SNAPSHOT="/chemin/vers/mathadata-website/private/payload-snapshots/<timestamp>"
bash enquete_usages_2026/rebuild_all.sh
```

Schéma des colonnes, endpoint, gestion du token et promotion durable comme nouvelle référence :
[`DONNEES_BRUTES_CAPYTALE.md`](DONNEES_BRUTES_CAPYTALE.md).
