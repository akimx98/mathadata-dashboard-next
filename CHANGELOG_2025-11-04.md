# Changelog - 4 novembre 2025

## 📊 Restructuration des statistiques globales

### Nouvelles métriques de comportement enseignant
**Ajout de 3 nouveaux indicateurs dans "Statistiques globales d'usage"** :
- **Profs ont testé puis enseigné** : Nombre et % de profs qui ont d'abord testé l'activité (Role="teacher") avant de l'utiliser en classe (Role="student")
- **Profs ont enseigné sans tester** : Nombre et % de profs qui ont directement utilisé l'activité en classe sans la tester au préalable
- **Profs ont testé mais pas enseigné** : Nombre et % de profs qui ont testé l'activité mais ne l'ont jamais utilisée avec des élèves

**Algorithme** :
- Pour chaque professeur unique, analyse de toutes ses sessions
- Comparaison des timestamps de la première session "teacher" vs première session "student"
- Classification selon le comportement détecté

### Réorganisation de l'affichage
**Suppression de 4 lignes** de "Statistiques globales d'usage" :
- Nombre de lycées
- Nombre de collèges
- Profs Publics
- Profs Privés

**Création d'un nouveau tableau "Statistiques établissement"** :
- Positionné dans la colonne de droite, au-dessus de "Distribution des IPS"
- Contient les 4 métriques déplacées
- Meilleure organisation thématique des indicateurs

**Code** : `components/Dashboard.tsx` lignes ~688-750 (calcul) et ~1850-1930 (affichage)

---

## 📈 Tableau "Indicateurs de succès des activités en classe"

### Correction du bug des valeurs à 0%
**Problème identifié** : Les colonnes "Reprise", "Maison" et "2ème séance" affichaient 0% pour toutes les activités.

**Cause** : Les timestamps `created` et `changed` étaient passés en **secondes** à la fonction `analyzeSeance()`, alors qu'elle attendait des **millisecondes** pour créer les objets `Date`.

**Solution** : Multiplication par 1000 des timestamps avant l'appel à `analyzeSeance()`.
```typescript
created: (typeof s.created === 'number' ? s.created : parseInt(s.created as string, 10)) * 1000,
changed: (typeof s.changed === 'number' ? s.changed : parseInt(s.changed as string, 10)) * 1000
```

**Code** : `components/Dashboard.tsx` ligne ~1420

### Correction de la cohérence des séances
**Problème** : Différence de 1 séance entre le total des 2èmes séances dans le tableau par activité (22) vs statistiques globales (21).

**Cause** : Groupement différent entre les deux calculs :
- `activitySuccessMetrics` : groupement par `(teacher, activity, date)`
- `globalStats` : groupement par `(uai, teacher, activity)`

**Solution** : Harmonisation du groupement en utilisant `(uai, teacher, activity)` partout.

**Code** : `components/Dashboard.tsx` ligne ~1351

### Amélioration de l'affichage
**Affichage hybride pourcentages + valeurs absolues** :
- Colonnes "Reprise", "Maison", "2ème séance" : affichent maintenant `XX% (N)` où N est la valeur absolue
- Maintien du code couleur (vert/orange/rouge) sur les pourcentages
- Valeurs absolues en gris clair entre parenthèses

**Code** : `components/Dashboard.tsx` lignes ~1668-1691

### Nouvelle colonne "Taux usage après test"
**Remplacement** : La colonne "⏱️ Temps" a été remplacée par "🧪 Usage après test".

**Métrique** : Pour chaque activité, calcule le taux de conversion des profs qui testent vers ceux qui enseignent :
- Nombre de profs ayant testé l'activité (`Role="teacher"`)
- Parmi eux, nombre ayant ensuite enseigné l'activité (`Role="student"`)
- Pourcentage : `(nbProfsTestedThenTaught / nbProfsTested) * 100`

**Affichage** :
- Format : `XX% (n/m)` où n = profs testés puis enseignés, m = total profs testés
- Code couleur : Vert ≥75%, Orange ≥50%, Rouge <50%
- Affiche "—" si aucun prof n'a testé l'activité

**Utilité** : Évalue l'efficacité du processus d'adoption et la confiance des enseignants dans l'activité après test.

**Code** : `components/Dashboard.tsx` lignes ~1428-1450 (calcul) et ~1683-1697 (affichage)

---

## 🏫 Tableau "Lycées — usages"

### Correction du comptage des professeurs
**Problème** : Certains établissements affichaient 0 prof testant et 0 prof enseignant, alors que le modal détaillé montrait des tests de profs.

**Cause** : Logique trop restrictive exigeant `uai_teach === uai` ET `uai_el === uai` pour compter les profs enseignants.

**Solution** : Simplification de la logique :
- **Profs enseignant** : Compte tous les profs avec sessions `Role="student"` dans cet établissement (basé sur `uai_el`)
- **Profs testant** : Compte tous les profs avec sessions `Role="teacher"` dans cet établissement (basé sur `uai_teach`)

**Code** : `components/Dashboard.tsx` lignes ~335-348

---

## 🔍 Modal de détail des établissements

### Cohérence des identifiants professeurs
**Problème** : Un prof apparaissant dans "Séances par professeur" ET "Tests enseignants" avait deux identifiants différents (Prof A et Prof B).

**Solution** : Création d'un mapping cohérent `teacher → lettre` :
1. Les profs qui enseignent (sessions avec élèves) reçoivent les lettres en premier (A, B, C...)
2. Les profs qui testent uniquement (sans élèves) reçoivent les lettres suivantes
3. Un prof qui teste ET enseigne garde le même identifiant dans les deux sections

**Comportement final** :
- Prof A enseigne ET teste → "Prof A" dans les deux sections
- Prof B enseigne seulement → "Prof B" dans "Séances par professeur" uniquement
- Prof C teste seulement → "Prof C" dans "Tests enseignants" uniquement

**Code** : `components/Dashboard.tsx` lignes ~2023-2045 (mapping) et lignes ~2123, ~2237 (affichage)

### Correction du filtre des tests enseignants
**Modification** : `getTeacherUsagesForUai()` utilise maintenant `uai_teach` au lieu de `uai_el` pour identifier où le prof a testé.

**Code** : `components/Dashboard.tsx` ligne ~1150

---

## 🔧 Améliorations techniques

### Algorithme de clustering temporel
**Fenêtre** : 1 heure (`ONE_HOUR_MS = 3600000`) pour détecter les séances.

**Principe** : Les sessions d'élèves créées à moins d'1h d'intervalle avec le même prof et la même activité sont regroupées en une séance.

**Utilisation** : 
- Calcul du nombre de séances globales
- Détection des 2èmes séances (reprises collectives >1h après)
- Statistiques par activité

### Gestion des timestamps
**Format unifié** : Conversion systématique en millisecondes pour les calculs de dates
- Timestamps en base : secondes (epoch unix)
- Conversion : multiplication par 1000 pour `new Date()`
- Cohérence dans toutes les fonctions d'analyse

---

## 📝 Métriques calculées

### Au niveau global
- Total usages, élèves uniques, séances
- 2èmes séances (nombre et pourcentage)
- Moyenne élèves par séance
- Usages par année scolaire (2023-2024, 2024-2025, 2025-2026)
- **Nouveau** : Comportement des enseignants (testé puis enseigné, enseigné sans tester, testé sans enseigner)

### Par établissement
- Nombre de séances (clustering 1h)
- Nombre d'élèves uniques
- Nombre de profs enseignant
- Nombre de profs testant
- IPS (si lycée)

### Par activité
- Adoption : lycées, séances, profs, élèves uniques
- Engagement : taille classe moyenne, reprise >1h, travail à domicile, 2ème séance
- Fidélisation : séances par prof
- **Nouveau** : Taux usage après test (conversion test → enseignement)

---

## 📚 Fichiers modifiés

### `components/Dashboard.tsx` (2873 lignes)
**Principales sections modifiées** :
- `globalStats` useMemo (~492-750) : Ajout analyse comportement enseignants
- `getEtablissementStats()` (~288-360) : Correction comptage profs
- `activitySuccessMetrics` useMemo (~1297-1470) : Ajout taux usage après test, correction timestamps
- `getTeacherUsagesForUai()` (~1147-1190) : Correction filtre uai_teach
- Modal établissement (~2018-2300) : Mapping cohérent identifiants profs
- Affichage tableau activités (~1580-1720) : Nouvelle colonne, affichage hybride

**Aucune autre modification dans les autres fichiers du projet**.

---

## 🎯 Objectifs atteints

1. ✅ **Analyse du comportement enseignant** : 3 nouvelles métriques permettent de comprendre comment les profs adoptent MathAData
2. ✅ **Correction des bugs d'affichage** : Tous les indicateurs affichent maintenant des valeurs correctes
3. ✅ **Cohérence des données** : Harmonisation des algorithmes de calcul entre les différentes sections
4. ✅ **Amélioration UX** : Identifiants professeurs cohérents, affichage hybride pourcentages + valeurs absolues
5. ✅ **Nouvelle métrique d'adoption** : Taux de conversion test → enseignement pour évaluer l'efficacité

---

## 🔜 Points d'attention pour la suite

### Données
- Les timestamps `created` et `changed` dans le CSV sont en **secondes** (epoch unix)
- Toujours multiplier par 1000 avant de créer des objets `Date`
- `uai_teach` = UAI de l'établissement du prof
- `uai_el` = UAI de l'établissement de l'élève
- `Role` = "teacher" pour tests, "student" pour usages en classe

### Algorithmes
- Clustering temporel : fenêtre de 1 heure
- Groupement séances : `(uai, teacher, mathadata_id)`
- 2ème séance : au moins 2 élèves reprennent ensemble >1h après la séance initiale

### Limites connues
- Un prof enseignant la même activité dans deux établissements le même jour sera compté comme 2 séances distinctes (comportement voulu)
- Les profs avec UAI NULL ou absent de l'annuaire sont classés comme "Privé"
- L'algorithme de clustering peut parfois fusionner deux classes consécutives dans la même heure (cas rare)

---

## 📊 Métriques clés disponibles

### Indicateurs d'adoption
- Nombre total de professeurs : `nombreProfsPublics` + `nombreProfsPrives`
- Taux de test préalable : `profsTestedThenTaught / (profsTestedThenTaught + profsTaughtWithoutTesting + profsTestedButNeverTaught)`
- Taux d'abandon après test : `profsTestedButNeverTaught / nbProfsTested`

### Indicateurs d'engagement
- Taux de continuité : `totalDeuxiemeSeances / totalSeances`
- Élèves reprenant >1h : colonne "Reprise" du tableau activités
- Travail à domicile : colonne "Maison" du tableau activités

### Indicateurs de succès par activité
- Récurrence : `seancesParProf` (nombre moyen)
- Conversion test : `tauxUsageApresTest` (%)
- Adoption établissements : `nbLycees`
