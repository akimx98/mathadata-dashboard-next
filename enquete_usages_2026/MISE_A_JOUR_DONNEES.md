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

### Attention à la branche du dépôt site

La branche par défaut du dépôt site est `master`, mais le script complet est disponible
sur `dev` à partir du commit `4b4eed45`.

Ne pas changer automatiquement la branche du clone site : un collègue peut avoir des
modifications en cours. Commencer par récupérer les références distantes et vérifier que
le commit requis a bien été publié :

```bash
SITE_REPO="/chemin/vers/mathadata-website"
SNAPSHOT_COMMIT="4b4eed45"

git -C "$SITE_REPO" fetch origin dev
git -C "$SITE_REPO" cat-file -e "${SNAPSHOT_COMMIT}^{commit}"
git -C "$SITE_REPO" merge-base --is-ancestor "$SNAPSHOT_COMMIT" origin/dev
```

Si l'une des deux dernières commandes échoue, `origin/dev` ne contient pas encore la
version requise : ne pas poursuivre avec une ancienne version du script.

Vérifier ensuite la branche actuellement ouverte :

```bash
git -C "$SITE_REPO" merge-base --is-ancestor "$SNAPSHOT_COMMIT" HEAD
```

- code retour `0` : exécuter directement le script depuis le clone courant ;
- code retour non nul : utiliser le worktree temporaire ci-dessous.

### Cas A — la branche courante contient le script

```bash
SITE_REPO="/chemin/vers/mathadata-website"

read -r -p "E-mail admin Payload : " REMOTE_ADMIN_EMAIL
read -r -s -p "Mot de passe admin Payload : " REMOTE_ADMIN_PASSWORD
printf '\n'

REMOTE_PAYLOAD_URL="https://mathadata.fr" \
REMOTE_ADMIN_EMAIL="$REMOTE_ADMIN_EMAIL" \
REMOTE_ADMIN_PASSWORD="$REMOTE_ADMIN_PASSWORD" \
node "$SITE_REPO/src/scripts/snapshotPayloadToLocal.mjs" --limit 5000

unset REMOTE_ADMIN_EMAIL REMOTE_ADMIN_PASSWORD
```

Le nouveau snapshot se trouve dans :

```text
mathadata-website/private/payload-snapshots/<timestamp>/
```

### Cas B — la branche courante ne contient pas le script

Cette méthode n'altère ni la branche courante ni les fichiers de travail du dépôt site :

```bash
SITE_REPO="/chemin/vers/mathadata-website"
SNAPSHOT_WORKTREE="${SITE_REPO}-snapshot-worktree"
SNAPSHOT_ROOT="$SITE_REPO/private/payload-snapshots"
SNAPSHOT_COMMIT="4b4eed45"

git -C "$SITE_REPO" fetch origin dev
git -C "$SITE_REPO" merge-base --is-ancestor "$SNAPSHOT_COMMIT" origin/dev
git -C "$SITE_REPO" worktree add --detach "$SNAPSHOT_WORKTREE" "$SNAPSHOT_COMMIT"

read -r -p "E-mail admin Payload : " REMOTE_ADMIN_EMAIL
read -r -s -p "Mot de passe admin Payload : " REMOTE_ADMIN_PASSWORD
printf '\n'

REMOTE_PAYLOAD_URL="https://mathadata.fr" \
REMOTE_ADMIN_EMAIL="$REMOTE_ADMIN_EMAIL" \
REMOTE_ADMIN_PASSWORD="$REMOTE_ADMIN_PASSWORD" \
node "$SNAPSHOT_WORKTREE/src/scripts/snapshotPayloadToLocal.mjs" \
  --limit 5000 \
  --output-root "$SNAPSHOT_ROOT"

unset REMOTE_ADMIN_EMAIL REMOTE_ADMIN_PASSWORD
git -C "$SITE_REPO" worktree remove "$SNAPSHOT_WORKTREE"
```

Le snapshot est conservé dans le clone principal sous
`private/payload-snapshots/<timestamp>/`.

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

L'extraction Capytale est indépendante du snapshot Payload. Voir
[`../DONNEES_BRUTES_CAPYTALE.md`](../DONNEES_BRUTES_CAPYTALE.md) pour le schéma de
l'API. Après remplacement de l'entrée Capytale de référence, relancer le même
`rebuild_all.sh`.
