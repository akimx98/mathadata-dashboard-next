# Documentation des données brutes Capytale MathAData

## Source

Les données sont fournies par l'API statistique Capytale :

```text
GET https://capytale2.ac-paris.fr/web/c-stat/mathadata
Authorization: Bearer <jeton>
```

La réponse est un fichier CSV UTF-8. Il s'agit d'un **instantané cumulatif** :
chaque extraction contient les usages historiques encore présents dans la source au
moment de l'appel.

## Que représente une ligne ?

Une ligne représente une **affectation Capytale clonée à partir de la chaîne d'une
activité MathAData suivie**.

Dans ce projet, cette affectation est appelée un **usage**.

Deux parcours principaux produisent une ligne :

1. **Test ou appropriation par un professeur**

   Un professeur clone une activité MathAData pour la consulter, la tester ou préparer
   son propre code de partage. La ligne porte normalement `role = teacher`.

2. **Usage par un élève**

   Un professeur partage son activité ou son code Capytale. Chaque élève qui le clone
   obtient sa propre affectation. Chaque clone élève produit une ligne avec
   `role = student`.

Une ligne ne représente donc pas :

- une visite de page ;
- un clic ;
- chaque exécution du notebook ;
- une séance de classe complète ;
- chaque sauvegarde successive.

Une séance avec 25 élèves produit généralement environ 25 lignes, une par affectation
élève. Les séances et les classes doivent être reconstruites en regroupant plusieurs
lignes, par exemple par professeur, activité et proximité temporelle.

## Chaîne des identifiants

Les trois identifiants principaux correspondent à différents niveaux de la chaîne de
clonage :

```text
activité MathAData d'origine
        mathadata_id
              │
              ▼
activité ou code Capytale intermédiaire
        activity_id
              │
              ▼
affectation individuelle clonée
        assignment_id
```

- `mathadata_id` identifie la ressource MathAData d'origine suivie.
- `activity_id` identifie l'activité Capytale immédiatement utilisée pour créer
  l'affectation. Pour les élèves, il s'agit généralement de l'activité ou du code
  partagé par le professeur.
- `assignment_id` identifie la copie individuelle obtenue par l'utilisateur.

Plusieurs élèves d'une même classe peuvent donc avoir des `assignment_id` différents
mais partager le même `activity_id`, le même `teacher` et le même `mathadata_id`.

## Dictionnaire des colonnes

### `assignment_id`

Identifiant Capytale de l'affectation individuelle.

- Type : entier représenté dans le CSV sous forme de texte.
- Grain : une valeur par ligne.
- Usage : dédoublonnage et identification d'un clone précis.
- Dans l'extraction actuelle, cet identifiant est unique.

### `created`

Date de création de l'affectation.

- Type : timestamp Unix en secondes.
- Fuseau du timestamp : UTC.
- Exemple : `1710858231`.
- Usage : dater le clone et reconstruire les usages mensuels ou les séances.

Conversion JavaScript :

```js
new Date(Number(created) * 1000)
```

### `changed`

Date de dernière modification connue de l'affectation.

- Type : timestamp Unix en secondes.
- `changed >= created`.
- `changed = created` signifie qu'aucune modification ultérieure distincte n'est
  enregistrée dans l'extraction.

La différence `changed - created` est un indicateur imparfait de durée de travail. Elle
peut inclure une reprise plusieurs heures ou plusieurs jours plus tard et ne constitue
pas un chronomètre fiable.

### `assignment_title`

Titre de l'affectation clonée.

- Il peut être hérité de l'activité d'origine.
- Il peut contenir un préfixe comme `Copie de`.
- Il peut avoir été renommé par le professeur ou lors du partage.
- Il ne doit pas servir seul à identifier une activité.

Pour les regroupements, utiliser `mathadata_id`.

### `student`

Identifiant pseudonymisé du compte qui possède ou utilise l'affectation individuelle.

- Pour `role = student`, il identifie l'élève ayant cloné le code du professeur.
- Pour `role = teacher`, malgré le nom historique de la colonne, il peut identifier
  le compte ayant reçu ou créé la copie de test.
- Un même identifiant peut apparaître sur plusieurs activités ou à plusieurs dates.

Cet identifiant est pseudonymisé, mais reste un identifiant individuel stable dans le
jeu de données. Il doit être traité comme une donnée sensible.

### `role`

Classification de l'usage dans la chaîne de clonage.

Valeurs actuellement observées :

- `teacher` : clone ou usage classé comme professeur ;
- `student` : clone élève issu d'une activité ou d'un code professeur ;
- valeur vide : rôle non déterminé, donnée historique ou cas technique.

Une valeur vide ne doit pas être automatiquement transformée en `student` ou
`teacher`.

Dans le CSV brut de l'API, le nom de colonne est `role`. Le stockage normalisé du
dashboard utilise `Role`. Les deux désignent la même information.

### `uai_el`

Code UAI de l'établissement associé à l'élève ou à l'affectation individuelle.

- Pour les usages `student`, c'est la colonne de référence pour localiser l'usage en
  classe.
- Elle peut être vide si l'établissement n'est pas connu.
- Pour un usage professeur, sa présence n'implique pas qu'elle soit la meilleure
  colonne pour localiser le professeur.

Pour les tests professeurs, utiliser prioritairement `uai_teach`.

### `activity_id`

Identifiant de l'activité Capytale immédiatement parente de l'affectation.

- Pour un élève, il correspond généralement à l'activité ou au code partagé par le
  professeur.
- Plusieurs élèves d'une même distribution partagent souvent cet identifiant.
- Un même `mathadata_id` peut être associé à de nombreux `activity_id`, car plusieurs
  professeurs peuvent cloner et redistribuer la même activité MathAData.

### `teacher`

Identifiant pseudonymisé du professeur associé à la chaîne de distribution.

- Pour `role = student`, il permet de rattacher l'affectation élève au professeur ayant
  partagé l'activité.
- Il est utilisé pour compter les professeurs uniques et regrouper les élèves d'une
  même séance.
- Pour `role = teacher`, il représente le professeur associé à l'activité parente. Il
  n'est pas garanti qu'il soit toujours identique à `student`.

Comme `student`, il s'agit d'un identifiant pseudonymisé stable et sensible.

### `uai_teach`

Code UAI de l'établissement du professeur associé.

- Colonne de référence pour localiser les tests ou clones professeurs.
- Pour les usages élèves, elle permet de connaître l'établissement du professeur
  lorsque cette information est disponible.
- Elle peut être vide.

### `mathadata_id`

Identifiant canonique de l'activité MathAData d'origine.

- C'est la clé principale pour regrouper les usages par activité pédagogique.
- Elle reste identique à travers les clones professeurs et élèves.
- Elle doit être préférée aux titres, qui peuvent être modifiés.

Exemple :

```text
2548348
```

### `mathadata_title`

Titre canonique de l'activité MathAData d'origine.

- Il décrit la ressource correspondant à `mathadata_id`.
- Il est plus stable que `assignment_title`.
- Le code du dashboard peut lui associer un titre court pour l'affichage, mais le CSV
  conserve le titre complet.

## Colonne supplémentaire dans les exports Metabase

Certains exports intermédiaires, comme `csv_from_metabase_raw.csv`, contiennent une
treizième colonne :

### `Ingested At`

Date à laquelle la ligne a été chargée dans la base ou le pipeline Metabase.

- Type : date ISO 8601, par exemple `2026-06-04T12:01:29.295775Z`.
- Cette date ne correspond ni à la création de l'affectation ni à son dernier usage.
- Elle sert à suivre l'ingestion technique des données.

Cette colonne n'est pas présente dans la réponse CSV directe de l'API Capytale.

## Exemples conceptuels

### Clone d'un professeur

```text
role = teacher
student = prof_A
teacher = prof_A ou professeur associé à l'activité parente
mathadata_id = activité MathAData d'origine
activity_id = activité Capytale ayant servi au clone
assignment_id = copie individuelle du professeur
```

### Clones d'une classe

```text
Élève 1 : assignment_id = copie_1, student = eleve_1
Élève 2 : assignment_id = copie_2, student = eleve_2
Élève 3 : assignment_id = copie_3, student = eleve_3

Valeurs communes :
role = student
teacher = prof_A
activity_id = code partagé par prof_A
mathadata_id = activité MathAData d'origine
```

Ces lignes peuvent être regroupées pour détecter une séance de classe, mais le CSV ne
contient pas directement un identifiant de séance.

## Précautions d'interprétation

### Un usage n'est pas un utilisateur unique

Un même élève ou professeur peut produire plusieurs lignes :

- en clonant plusieurs activités ;
- en utilisant plusieurs codes ;
- en créant plusieurs affectations ;
- à différentes périodes.

Pour compter les personnes uniques, utiliser les identifiants pseudonymisés `student`
ou `teacher` avec le périmètre temporel souhaité.

### Un usage n'est pas une séance

Une séance est une construction analytique. Elle peut être estimée en regroupant les
lignes `student` ayant :

- le même `teacher` ;
- le même `mathadata_id` ou `activity_id` ;
- un établissement cohérent ;
- des dates de création proches.

### Les champs UAI peuvent être absents

L'absence de `uai_el` ou `uai_teach` ne signifie pas l'absence d'usage. Elle signifie
que l'établissement n'a pas pu être rattaché dans la source.

### Les rôles vides doivent rester à part

Les lignes sans rôle sont comptabilisables comme affectations, mais elles ne doivent
pas alimenter directement les indicateurs « élèves » ou « professeurs » sans règle
métier supplémentaire.

### Les identifiants sont pseudonymisés, pas anonymes

Les valeurs `student` et `teacher` ne donnent pas directement l'identité civile, mais
elles permettent de suivre un même compte dans le temps. Leur diffusion doit donc être
limitée et encadrée.
