# Pour démarrer — interroger les données avec Claude

Ce guide couvre les deux cas courants :

1. poser une question statistique sur les données déjà analysées ;
2. obtenir une liste nominative interne — noms et e-mails — sans régénérer les analyses.

La mise à jour complète des sources et des chiffres est une opération distincte, rarement nécessaire pour répondre à une question.

## Prérequis communs

- Git ;
- Python 3 ;
- Claude Code ;
- pour les questions nominatives : accès au dépôt privé `mathadata-website` et compte administrateur
  sur <https://mathadata.fr/admin>.

Cloner le dépôt d'analyse :

```bash
git clone <URL_DU_DEPOT>
cd mathadata-dashboard-next
python3 -m pip install pandas numpy
git config core.hooksPath enquete_usages_2026/hooks
```

Claude lit automatiquement [`CLAUDE.md`](CLAUDE.md) et la skill
`.claude/skills/analyse-usages-mathadata/`.

## Cas 1 — question statistique non nominative

Aucun autre setup n'est nécessaire. Le clone contient déjà :

- les `facts_*.json`, sources de vérité des chiffres publiés ;
- les tables canoniques par usage, séance, professeur et année ;
- les profils, cohortes et appariements pseudonymisés ;
- les rapports et dashboards.

Lancer Claude à la racine :

```bash
claude
```

Exemples :

```text
Combien de professeurs ont atteint un usage-classe en 2024-2025 ?
Précise la définition, le dénominateur et les exclusions.
```

```text
Compare le retour en 2025-2026 des professeurs ayant fait un usage unique
et de ceux ayant fait plusieurs usages en 2024-2025.
```

Claude doit commencer par les faits et tables déjà versionnés. Il ne doit pas relancer le pipeline pour répondre à ces questions.

## Cas 2 — question nominative sans régénérer les analyses

### Résultat attendu

Le collègue utilise :

- les analyses Capytale déjà versionnées dans ce dépôt ;
- un snapshot Payload local pour obtenir les noms et e-mails ;
- un petit pont nominatif local pour relier, lorsque c'est possible, une identité Payload à un profil Capytale.

Cette procédure ne modifie aucun chiffre, profil, rapport ou dashboard versionné.

### Étape 1 — récupérer le snapshot Payload

Les deux dépôts doivent être voisins :

```text
MathAData_Git/
├── mathadata-dashboard-next/
└── mathadata-website/
```

Créer un snapshot complet depuis la production :

```bash
read -r -p "E-mail admin Payload (PROD) : " REMOTE_ADMIN_EMAIL
read -r -s -p "Mot de passe admin Payload (PROD) : " REMOTE_ADMIN_PASSWORD
printf '\n'

REMOTE_PAYLOAD_URL="https://mathadata.fr" \
REMOTE_ADMIN_EMAIL="$REMOTE_ADMIN_EMAIL" \
REMOTE_ADMIN_PASSWORD="$REMOTE_ADMIN_PASSWORD" \
node src/scripts/snapshotPayloadToLocal.mjs --limit 5000

unset REMOTE_ADMIN_EMAIL REMOTE_ADMIN_PASSWORD
```

Ne pas utiliser `--since` : il faut l'historique complet. Le snapshot est écrit dans :

```text
mathadata-website/private/payload-snapshots/<timestamp>/
```

### Étape 2 — sélectionner le snapshot

Revenir dans le dépôt d'analyse :

```bash
cd ../mathadata-dashboard-next

export MATHADATA_SNAPSHOT="$(
  ls -dt ../mathadata-website/private/payload-snapshots/* | head -1
)"

test -f "$MATHADATA_SNAPSHOT/users.json"
```

Pour une question portant uniquement sur les données du site — par exemple les inscrits à une
formation — cela suffit : Claude peut lire directement `$MATHADATA_SNAPSHOT/users.json`.

### Étape 3 — créer le pont nominatif local

Pour relier noms et e-mails aux profils d'usage Capytale déjà calculés :

```bash
python3 enquete_usages_2026/site-vers-classe/match_individuals.py --local-only
```

Cette commande crée uniquement :

```text
enquete_usages_2026/_local/match_nominatif.csv
```

Elle ne lance pas `rebuild_all.sh` et ne modifie aucun fichier versionné.

### Étape 4 — poser la question dans le même terminal

```bash
claude
```

Exemple :

```text
Analyse nominative interne.

Crée un CSV avec les noms et e-mails des professeurs qui ont atteint au moins
un usage-classe en 2024-2025 et n'ont atteint aucun usage-classe ensuite.

Utilise la définition canonique d'usage-classe, les profils déjà versionnés et
le pont nominatif local. Inclus la confiance de l'appariement et écris le fichier
dans enquete_usages_2026/private/.
```

Claude doit alors :

1. lire les profils annuels déjà calculés dans
   `enquete_usages_2026/transverse/data/profiles_teacher_year.csv` ;
2. sélectionner les professeurs avec un niveau canonique `>= 4` en `2024-2025` et aucun niveau
   `>= 4` après cette année ;
3. joindre ces profils avec `_local/match_nominatif.csv` ;
4. écrire le CSV dans `enquete_usages_2026/private/` ;
5. indiquer la couverture et la confiance des appariements.

### Limite importante

Capytale est pseudonymisé et ne partage aucun identifiant direct avec `mathadata.fr`. Le pont
nominatif est donc **inféré**, avec une confiance A ou B, et ne couvre pas tous les professeurs.

Le résultat nominatif contient uniquement les profils attribuables avec le niveau de confiance
indiqué. Claude doit aussi donner :

- le nombre total de profils Capytale répondant au critère ;
- le nombre et la proportion de ces profils auxquels une identité a pu être attribuée.

Une absence de nom dans le CSV ne signifie pas que le professeur n'existe pas : elle signifie que
son identité n'est pas attribuable avec les données disponibles.

## Confidentialité

Le snapshot Payload, `_local/match_nominatif.csv` et les CSV nominatifs sont des données
personnelles à usage interne.

- Ne jamais les committer.
- Ne jamais les copier dans `data/`, un rapport, un dashboard, une issue ou une CI.
- Écrire les livrables uniquement dans `enquete_usages_2026/private/`.
- Vérifier avant écriture :

  ```bash
  git check-ignore -q enquete_usages_2026/private/
  ```

- Marquer les fichiers : « usage interne — données personnelles — ne pas publier ».

## Quand faut-il réellement régénérer les analyses ?

Uniquement si l'objectif est d'actualiser les chiffres avec :

- un nouveau CSV Capytale ;
- un nouveau snapshot Payload utilisé comme nouvelle base analytique ;
- une modification des définitions ou du pipeline.

Dans ce cas, suivre
[`enquete_usages_2026/MISE_A_JOUR_DONNEES.md`](enquete_usages_2026/MISE_A_JOUR_DONNEES.md).

Pour une simple question statistique ou nominative sur les analyses existantes, ne pas lancer
`rebuild_all.sh`.

## Documents de référence

1. [`enquete_usages_2026/transverse/GLOSSAIRE.md`](enquete_usages_2026/transverse/GLOSSAIRE.md)
   — définitions canoniques ;
2. [`enquete_usages_2026/transverse/SYNTHESE_FINALE_2026.md`](enquete_usages_2026/transverse/SYNTHESE_FINALE_2026.md)
   — synthèse des résultats ;
3. [`enquete_usages_2026/README.md`](enquete_usages_2026/README.md)
   — carte des analyses ;
4. [`CLAUDE.md`](CLAUDE.md) — méthode et règles de sécurité.
