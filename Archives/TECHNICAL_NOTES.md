# Notes techniques - Dashboard MathAData

## 🏗️ Architecture

### Composant principal
**`components/Dashboard.tsx`** (2873 lignes)
- Composant React unique contenant toute la logique métier
- Utilise `useMemo` pour optimiser les calculs lourds
- Pas de découpage en sous-composants (pour l'instant)

### State management
- `useState` pour l'état local (filtres, modal, tri)
- Pas de Redux ou Context API nécessaire
- Tout est calculé à partir des données CSV chargées

### Données
- Chargement synchrone des CSV au montage du composant
- Parse avec bibliothèque `papaparse`
- Stockage dans `useState` : `rows`, `annuaireRows`

## 📊 Structures de données principales

### Row (ligne CSV)
```typescript
{
  student: string;           // ID anonymisé
  teacher: string;           // ID anonymisé
  Role: "student" | "teacher";
  mathadata_id: string;      // ID activité
  mathadata_title?: string;
  uai?: string;              // UAI établissement (général)
  uai_el?: string;           // UAI établissement élève
  uai_teach?: string;        // UAI établissement prof
  created: string | number;  // Timestamp secondes
  changed: string | number;  // Timestamp secondes
  _date?: Date;              // Date parsée (ajoutée)
}
```

### AnnuaireRow (annuaire établissements)
```typescript
{
  uai: string;
  nom_etablissement: string;
  ville: string;
  academie: string;
  type_etablissement: "lycee" | "college";
  secteur: "Public" | "Privé";
  ips?: string | number;     // Indice Position Sociale
  latitude?: string | number;
  longitude?: string | number;
}
```

### SessionType (session normalisée)
```typescript
{
  student: string;
  teacher: string;
  mathadata_id: string;
  mathadata_title: string;
  created: number;           // Millisecondes
  changed: number;           // Millisecondes
}
```

## 🧮 Fonctions de calcul clés

### `parseMaybeEpoch(value)`
Convertit une valeur en Date :
- Si nombre : considère comme secondes epoch → `new Date(value * 1000)`
- Si string : parse ISO → `new Date(value)`
- Retourne `null` si invalide

### `getEtablissementStats(uai)`
Calcule les statistiques pour un établissement :
1. Filtre les sessions élèves (`Role="student"`)
2. Compte les élèves uniques
3. Clustering temporel (1h) pour compter les séances
4. Compte les profs enseignant (avec sessions élèves)
5. Compte les profs testant (avec sessions `Role="teacher"`)

**⚠️ Point d'attention** : Utilise `uai_el` pour localiser les élèves, `uai_teach` pour les tests profs.

### `getClassActivityDetailsForUai(uai)`
Détaille les séances par professeur :
1. Filtre sessions élèves de l'établissement
2. Groupe par `(teacher, mathadata_id)`
3. Clustering temporel (1h) sur chaque groupe
4. Calcule métrique par séance (nb élèves, durée moyenne)
5. Groupe les séances par professeur
6. Retourne `{ teacher, seances[] }[]`

### `getTeacherUsagesForUai(uai)`
Liste les tests des professeurs :
1. Filtre sessions avec `Role="teacher"` et `uai_teach === uai`
2. Groupe par professeur
3. Extrait infos (activité, dates, durée)
4. Retourne `{ teacher, tests[] }[]`

### `analyzeSeance(sessions)`
Analyse une séance (cluster de sessions) :
- **Reprise >1h** : Compte élèves avec `(changed - created) > 1h`
- **Travail à domicile** : Détecte modifications soir (≥18h) ou weekend
- **2ème séance** : Clustering sur modifications >1h après séance, cherche groupe ≥2 élèves

**⚠️ Critical** : Attend timestamps en **millisecondes** !

### Clustering temporel
```typescript
const ONE_HOUR_MS = 3600000; // 1 heure en millisecondes
let currentCluster: Session[] = [];
let clusterStartTime = 0;

sorted.forEach(session => {
  if (currentCluster.length === 0) {
    currentCluster.push(session);
    clusterStartTime = session.created;
  } else {
    const elapsed = session.created - clusterStartTime;
    if (elapsed <= ONE_HOUR_MS) {
      currentCluster.push(session); // Même cluster
    } else {
      // Nouveau cluster
      clusters.push(currentCluster);
      currentCluster = [session];
      clusterStartTime = session.created;
    }
  }
});
```

## 🎯 Métriques calculées

### GlobalStats (useMemo)
```typescript
{
  totalUsages: number;
  totalEtablissements: number;
  totalElevesUniques: number;
  nombreLycees: number;
  nombreColleges: number;
  nombreProfsPublics: number;
  nombreProfsPrives: number;
  usages2023_2024: number;
  usages2024_2025: number;
  usages2025_2026: number;
  totalSeances: number;
  totalDeuxiemeSeances: number;
  pourcentage2eSeance: number;
  moyenneElevesParSeance: number;
  dureeMoyenneSeance: number;
  profsTestedThenTaught: number;      // Nouveau
  profsTaughtWithoutTesting: number;  // Nouveau
  profsTestedButNeverTaught: number;  // Nouveau
}
```

### ActivitySuccessMetrics (useMemo)
```typescript
{
  activityId: string;
  activityName: string;
  nbLycees: number;
  nbSeances: number;
  nbProfs: number;
  nbElevesUniques: number;
  tailleClasseMoyenne: number;
  nbReprise: number;                    // Valeur absolue
  nbTravailMaison: number;              // Valeur absolue
  nbDeuxiemeSeance: number;             // Valeur absolue
  tauxReprise: number;                  // Pourcentage
  tauxTravailMaison: number;            // Pourcentage
  tauxDeuxiemeSeance: number;           // Pourcentage
  seancesParProf: number;
  nbProfsTestedThenTaught: number;      // Nouveau
  nbProfsTested: number;                // Nouveau
  tauxUsageApresTest: number;           // Nouveau (%)
}
```

## 🐛 Bugs corrigés (4 nov 2025)

### Bug 1 : Timestamps incorrects dans analyzeSeance
**Symptôme** : Toutes les métriques "Reprise", "Maison", "2ème séance" à 0%.

**Cause** : Les timestamps passés à `analyzeSeance()` étaient en secondes, fonction attendait millisecondes.

**Fix** :
```typescript
// AVANT (FAUX)
created: typeof s.created === 'number' ? s.created : parseInt(s.created as string, 10),

// APRÈS (CORRECT)
created: (typeof s.created === 'number' ? s.created : parseInt(s.created as string, 10)) * 1000,
```

### Bug 2 : Incohérence comptage 2èmes séances
**Symptôme** : Total dans tableau activités ≠ total statistiques globales.

**Cause** : Groupement différent (avec/sans UAI).

**Fix** : Harmonisation du groupement par `(uai, teacher, mathadata_id)` partout.

### Bug 3 : Profs non comptés dans tableau lycées
**Symptôme** : Certains établissements affichaient 0 prof alors que modal montrait des usages.

**Cause** : Condition `uai_teach === uai AND uai_el === uai` trop restrictive.

**Fix** : Simplification :
- Profs enseignant : filtre sur `uai_el === uai && Role="student"`
- Profs testant : filtre sur `uai_teach === uai && Role="teacher"`

### Bug 4 : Identifiants profs incohérents
**Symptôme** : Même prof = "Prof A" dans séances, "Prof B" dans tests.

**Cause** : Numérotation indépendante dans chaque section.

**Fix** : Mapping global créé en début de modal :
```typescript
const teacherToLetter = new Map<string, string>();
// 1. Lettres pour profs qui enseignent
classActivityDetails.forEach(prof => teacherToLetter.set(prof.teacher, letter++));
// 2. Lettres pour profs qui testent uniquement
teacherUsages.forEach(prof => { if (!has) teacherToLetter.set(...) });
```

## 🔐 Conventions de code

### Nommage
- **Functions** : camelCase (`getEtablissementStats`)
- **Types** : PascalCase (`SessionType`, `AnnuaireRow`)
- **Constants** : SCREAMING_SNAKE_CASE (`ONE_HOUR_MS`)
- **useMemo variables** : camelCase (`globalStats`, `activitySuccessMetrics`)

### Timestamps
**Règle absolue** : Toujours multiplier par 1000 avant `new Date()` !
```typescript
// ✅ CORRECT
const date = new Date(timestamp * 1000);
const created = r._date!.getTime(); // Déjà en ms

// ❌ FAUX
const date = new Date(timestamp); // Si timestamp en secondes
```

### Groupement pour clustering
**Clé standard** : `${uai}|${teacher}|${mathadata_id}`
```typescript
const key = `${uai}|${teacher}|${mathadata_id}`;
groups.set(key, [...]);
```

### Couleurs
```typescript
const getColor = (value: number, thresholds: [number, number]) => {
  if (value >= thresholds[1]) return "#10b981"; // Vert
  if (value >= thresholds[0]) return "#f59e0b"; // Orange
  return "#ef4444"; // Rouge
};
```

## 🧪 Tests / Validation

### Cas de test documentés
Voir `ANALYSES_COPILOT.md` :
1. Prof 2dbf95b5c5289b340cd53d7d7dd016ec (usage typique)
2. Lycée 0931584S activité 3518185 (36 élèves)
3. Lycée 0930124E (2 classes consécutives, <1h05 entre elles)
4. Lycée 0590117G (support individuel)
5. Lycée 0601863Z (tests profs uniquement)

### Vérifications manuelles
Pour valider les calculs :
```bash
# Compter élèves uniques pour une activité
awk -F';' 'NR>1 { 
  if ($11 ~ /ACTIVITY_ID/ && $6 ~ /student/) { 
    gsub(/"/, "", $5); print $5; 
  } 
}' public/data/mathadata-V2.csv | sort -u | wc -l

# Compter profs testant dans un lycée
awk -F';' 'NR>1 { 
  if ($7 ~ /UAI/ && $6 ~ /teacher/) { 
    gsub(/"/, "", $5); print $5; 
  } 
}' public/data/mathadata-V2.csv | sort -u | wc -l
```

## 🚀 Performance

### Optimisations
- `useMemo` pour tous les calculs lourds (évite recalcul à chaque render)
- Pas de calcul dans la boucle de render
- Map/Set pour lookups O(1) au lieu de filter/find O(n)

### Points d'attention
- Fichier CSV chargé entièrement en mémoire (~2100 lignes = OK)
- Si >10k lignes : considérer pagination ou backend
- Clustering = O(n log n) à cause du tri, acceptable jusqu'à 100k sessions

## 📦 Dépendances principales

```json
{
  "next": "15.5.4",
  "react": "^19.0.0",
  "recharts": "^2.x",
  "leaflet": "^1.x",
  "papaparse": "^5.x"
}
```

## 🔜 Améliorations possibles

### Court terme
- [ ] Exporter les données filtrées en CSV
- [ ] Ajouter filtre par académie/région
- [ ] Graphique évolution temporelle des usages

### Moyen terme
- [ ] Backend API pour calculs lourds
- [ ] Cache des résultats (Redis)
- [ ] Dashboard temps réel (WebSocket)

### Long terme
- [ ] Machine learning pour prédire adoption
- [ ] Recommandations d'activités par profil établissement
- [ ] Intégration LMS (Moodle, Pronote)

## 📞 Contact / Support

Pour questions techniques :
1. Consulter `ANALYSES_COPILOT.md` (cas d'usage)
2. Consulter `CHANGELOG_2025-11-04.md` (modifications récentes)
3. Vérifier les timestamps (×1000 !) et le groupement (avec UAI)
