# Configuration du Dashboard MathAData

## 📊 Sources de données officielles des académies

### Vue d'ensemble

Le dashboard affiche des statistiques officielles sur les établissements scolaires français, provenant de l'API open data du Ministère de l'Éducation Nationale.

### Provenance des données

Le fichier versionné actuel a été produit depuis **data.education.gouv.fr** (API v2.1) avec les
millésimes indiqués ci-dessous. Il s'agit d'un instantané technique, pas d'une source mise à jour
automatiquement :

#### 1. **Nombre de collèges**
- **Source** : Dataset `fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre`
- **Date de génération de l'instantané** : novembre 2025
- **Méthode** : Comptage des établissements où `nature_uai_libe="COLLEGE"`
- **URL** : https://data.education.gouv.fr/explore/dataset/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre

#### 2. **Nombre de lycées GT (Général et Technologique)**
- **Source** : Dataset `fr-en-lycee_gt-effectifs-niveau-sexe-lv`
- **Année scolaire** : 2024-2025
- **Méthode** : `count(distinct numero_lycee)` où `rentree_scolaire="2024"`
- **Inclut** : TOUS les établissements ayant des élèves en voie GT (lycées généraux, technologiques, polyvalents)
- **URL** : https://data.education.gouv.fr/explore/dataset/fr-en-lycee_gt-effectifs-niveau-sexe-lv
- **⚠️ Note** : Ce chiffre est supérieur au nombre de "lycées GT purs" car il inclut les lycées polyvalents

#### 3. **Nombre de lycées Pro (Professionnels)**
- **Source** : Dataset `fr-en-lycee_pro-effectifs-niveau-sexe-lv`
- **Année scolaire** : 2024-2025
- **Méthode** : `count(distinct numero_lycee)` où `rentree_scolaire=date'2024-01-01'`
- **Inclut** : TOUS les établissements ayant des élèves en voie Pro (lycées professionnels, polyvalents)
- **URL** : https://data.education.gouv.fr/explore/dataset/fr-en-lycee_pro-effectifs-niveau-sexe-lv

#### 4. **Nombre d'élèves lycées GT**
- **Source** : Dataset `fr-en-lycee_gt-effectifs-niveau-sexe-lv`
- **Année scolaire** : 2024-2025
- **Méthode** : `sum(nombre_d_eleves)` où `rentree_scolaire="2024"`
- **Inclut** : 2nde GT, 1ère (Générale + Technologiques STI2D, STL, STMG, ST2S, STD2A, STHR), Terminale (idem)

#### 5. **Nombre d'élèves lycées Pro**
- **Source** : Dataset `fr-en-lycee_pro-effectifs-niveau-sexe-lv`
- **Année scolaire** : 2024-2025
- **Méthode** : `sum(nombre_d_eleves)` où `rentree_scolaire=date'2024-01-01'`
- **Inclut** : CAP, 2nde Pro, 1ère Pro, Terminale Pro

### Génération du fichier `academies_stats.json`

Le fichier `public/data/academies_stats.json` est généré par le script Python :

```bash
python3 generate_academies_stats_v2.py
```

**Structure du fichier** :
```json
{
  "Paris": {
    "nb_colleges": 214,
    "nb_lycees_gt": 123,
    "nb_lycees_pro": 58,
    "nb_eleves_lycees_gt": 57466,
    "nb_eleves_lycees_pro": 14176
  },
  "Normandie": {
    "nb_colleges": 394,
    "nb_lycees_gt": 70,
    "nb_lycees_pro": 59,
    "nb_eleves_lycees_gt": 43006,
    "nb_eleves_lycees_pro": 18234
  }
}
```

### Cohérence des données

**Exemple pour Paris** :
- 123 lycées GT × ~467 élèves/lycée ≈ 57,466 élèves GT ✅
- 58 lycées Pro × ~244 élèves/lycée ≈ 14,176 élèves Pro ✅

Les nombres d'établissements et d'élèves sont **cohérents** car ils proviennent du même dataset (effectifs).

### Différences avec les sites académiques

Les chiffres peuvent différer légèrement des sites académiques car :

1. **Lycées polyvalents** : Comptés dans GT ET Pro (ils ont les deux)
2. **Périmètre** : Les datasets incluent public + privé sous contrat
3. **Date de référence** : Rentrée 2024 vs. données temps réel des académies
4. **Définition** : Les académies peuvent utiliser d'autres critères de comptage

### Normalisation des noms d'académies

Le script normalise automatiquement :
- **Fusion Normandie** : Caen + Rouen → "Normandie"
- **DOM-TOM** : 
  - "La Réunion" (avec majuscule à "La")
  - "Guadeloupe" (sans "La")
  - "Martinique" (sans "La")
- **Accents** : Gestion Unicode (Créteil, Besançon, Orléans-Tours, etc.)

**Total** : 34 académies (30 académies métropolitaines + 4 collectivités d'outre-mer)

---

## 🎨 Configuration des noms courts des activités

### Comment personnaliser les noms des activités

Les noms longs des activités peuvent être remplacés par des noms courts plus lisibles dans le dashboard.

### Étape 1 : Identifier les IDs des activités

Ouvrez la console du navigateur (F12 → Console) et cherchez le message :
```
[usages] Activités trouvées: [...]
```

Vous verrez une liste comme :
```javascript
[
  ["2548348", "Intro à l'IA : classification de chiffres 2 et 7"],
  ["2548350", "Intro à l'IA : classification de chiffres (MNIST) - Notebook séquencé"],
  ...
]
```

### Étape 2 : Configurer les noms courts

Dans le fichier `components/Dashboard.tsx`, modifiez l'objet `ACTIVITY_SHORT_NAMES` :

```typescript
const ACTIVITY_SHORT_NAMES: Record<string, string> = {
  "2548348": "IA Chiffres 2 et 7",      // ← Modifiez ce nom court
  "2548350": "IA MNIST complet",        // ← Modifiez ce nom court
  "2548352": "Activité 3",              // ← À personnaliser
  // ... ajoutez vos autres activités
};
```

### Priorité des noms

Le système utilise cette priorité :
1. **Nom court personnalisé** (dans `ACTIVITY_SHORT_NAMES`) 
2. **Titre complet** (du CSV `mathadata_title`)
3. **ID** (`Activité {id}`)

### Exemple complet

```typescript
const ACTIVITY_SHORT_NAMES: Record<string, string> = {
  "2548348": "IA - Chiffres 2 et 7",
  "2548350": "IA - MNIST",
  "2548352": "Réseaux de neurones",
  "2548354": "Deep Learning",
  "2548356": "Apprentissage supervisé",
  "2548358": "Classification",
  "2548360": "Vision par ordinateur",
  "2548362": "NLP Intro",
  "2548364": "Transformers",
  "2548366": "GPT",
};
```

Les noms courts seront utilisés :
- Dans le menu déroulant de sélection d'activité
- Dans les titres des graphiques
- Sur l'axe Y du graphique en barres
- Dans les légendes des graphiques

---

## 🔄 Maintenance et mises à jour

### Mettre à jour les statistiques des académies

Pour mettre à jour les données officielles (à faire 1 fois par an, à la rentrée scolaire) :

```bash
# Régénérer le fichier academies_stats.json
python3 generate_academies_stats_v2.py

# Vérifier les résultats
cat public/data/academies_stats.json | python3 -c "import sys, json; data = json.load(sys.stdin); print(f'Total: {len(data)} académies'); print('Paris:', data.get('Paris'))"
```

**Quand mettre à jour** :
- Septembre/Octobre : Nouvelles données de rentrée scolaire disponibles
- À la demande : Si des écarts importants sont constatés avec les sites académiques

### Vérifier les sources de données

Pour vérifier qu'une académie spécifique a bien les données attendues :

```bash
# Exemple pour Paris - Lycées GT
curl -s -G 'https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-lycee_gt-effectifs-niveau-sexe-lv/records' \
  --data-urlencode 'select=count(distinct numero_lycee) as nb_lycees, sum(nombre_d_eleves) as total_eleves' \
  --data-urlencode 'where=rentree_scolaire="2024" AND academie="PARIS"' | \
  python3 -c "import sys, json; r = json.load(sys.stdin)['records'][0]['record']['fields']; print(f'Lycées GT: {r[\"nb_lycees\"]}, Élèves: {r[\"total_eleves\"]:,}')"

# Exemple pour Paris - Lycées Pro
curl -s -G 'https://data.education.gouv.fr/api/v2/catalog/datasets/fr-en-lycee_pro-effectifs-niveau-sexe-lv/records' \
  --data-urlencode 'select=count(distinct numero_lycee) as nb_lycees, sum(nombre_d_eleves) as total_eleves' \
  --data-urlencode "where=rentree_scolaire=date'2024-01-01' AND academie=\"PARIS\"" | \
  python3 -c "import sys, json; r = json.load(sys.stdin)['records'][0]['record']['fields']; print(f'Lycées Pro: {r[\"nb_lycees\"]}, Élèves: {r[\"total_eleves\"]:,}')"
```

### Structure des fichiers de données

```
public/data/
├── academies_stats.json          # Statistiques officielles des académies
├── annuaire_etablissements.csv   # Annuaire complet (avec IPS, coordonnées)
├── Mathadata20260210.csv          # Fallback runtime si aucun CSV n'est persisté
├── mathadata_2025-10-08.csv      # Donnée historique utilisée par la page de test/backup
└── academies.geojson             # Contours géographiques des académies
```

### Scripts de génération

```
generate_academies_stats_v2.py    # Script principal (utilise les datasets élèves)
```

**⚠️ Important** : `generate_academies_stats_v2.py` est le seul script de génération versionné.

---

## 🗺️ Carte des académies

### Fichier GeoJSON

Le fichier `public/data/academies.geojson` contient :
- **29 académies** (Mayotte manquant dans le fichier actuel)
- **Normandie unifiée** : MultiPolygon avec les anciens territoires de Caen et Rouen
- **Propriétés** : `nom`, `nom_normalise`, `zone_vacances`

### Normalisation des noms pour la carte

Le composant `UsageMap.tsx` normalise automatiquement les noms :

```typescript
// Exemples de normalisation
"Académie de Paris" → "Paris"
"Académie de la Réunion" → "La Réunion" (garde le "La" majuscule)
"Académie de la Guadeloupe" → "Guadeloupe" (enlève le "La")
"Académie de Caen" OU "Académie de Rouen" → "Normandie"
```

Cette normalisation assure la correspondance entre :
1. Les noms dans `academies.geojson`
2. Les clés dans `academies_stats.json`
3. Les noms dans `annuaire_etablissements.csv`

---

## 🐛 Résolution de problèmes courants

### Les chiffres diffèrent des sites académiques

**C'est normal** ! Raisons possibles :
1. **Date** : Nos données sont de la rentrée 2024, les sites peuvent afficher des données plus récentes
2. **Périmètre** : Les datasets incluent public + privé sous contrat
3. **Lycées polyvalents** : Comptés dans GT ET Pro (ils ont les deux voies)
4. **Définition** : Les académies peuvent compter différemment (ex: avec/sans EREA, SEGPA, etc.)

### Erreur "Cannot read properties of undefined (reading 'toLocaleString')"

Vérifier que tous les champs existent dans `academies_stats.json` :
- `nb_colleges`
- `nb_lycees_gt`
- `nb_lycees_pro`
- `nb_eleves_lycees_gt` (⚠️ pas `nb_eleves_gt`)
- `nb_eleves_lycees_pro` (⚠️ pas `nb_eleves_pro`)

### 0 usages affichés pour une académie

Vérifier la correspondance des noms :
```bash
# Dans le terminal
grep "nom_academie" public/data/annuaire_etablissements.csv | head -5
```

Les noms doivent correspondre exactement après normalisation.

### Académie manquante sur la carte

Vérifier la présence dans `academies.geojson` :
```bash
cat public/data/academies.geojson | python3 -c "import sys, json; data = json.load(sys.stdin); print([f['properties']['nom'] for f in data['features']])"
```

Si une académie manque (ex: Mayotte actuellement), elle n'apparaîtra pas sur la carte mais les statistiques seront disponibles dans les modales.

---

## 📝 Notes de développement

### Historique de la configuration (novembre 2025)

1. **Correction des sources de données** :
   - Adoption de `generate_academies_stats_v2.py`
   - Comptage depuis les datasets d'élèves (plus cohérent)
   - Paris : 51 → 123 lycées GT, 39 → 58 lycées Pro

2. **Correction des noms de champs** :
   - `nb_eleves_gt` → `nb_eleves_lycees_gt`
   - `nb_eleves_pro` → `nb_eleves_lycees_pro`
   - Mise à jour dans `Dashboard.tsx` et `UsageMap.tsx`

3. **Fusion Normandie** :
   - Caen + Rouen fusionnés automatiquement
   - Les frontières internes restent visibles (MultiPolygon)

### Architecture du dashboard

```
components/
├── Dashboard.tsx        # Composant principal
│   ├── Filtres (dates, académies, activités)
│   ├── Graphiques (barres, ligne, répartition)
│   ├── Tableaux (établissements, activités)
│   └── Modales (académie, établissement)
│
└── UsageMap.tsx        # Carte interactive Leaflet (245 lignes)
    ├── Affichage des académies (GeoJSON)
    ├── Tooltips avec statistiques
    ├── Click handlers → ouvre modal académie
    └── Toggle "Vue par académies"
```

### Dépendances clés

- **Next.js 15** : framework React
- **Leaflet 1.9.x** : Bibliothèque de cartes
- **Papa Parse** : Parsing CSV
- **Recharts** : Graphiques

### Commandes utiles

```bash
# Développement
npm run dev

# Build production
npm run build
npm start

# Régénérer les stats académiques
python3 generate_academies_stats_v2.py
```
