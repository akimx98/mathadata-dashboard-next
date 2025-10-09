# Implémentation Option C - Cohérence du filtrage

**Date** : 9 octobre 2025

## 🎯 Objectif

Rendre toutes les statistiques et graphiques **globaux** (non filtrés), sauf l'analyse temporelle et géographique (carte + évolution mensuelle + tableau lycées).

## ✅ Modifications effectuées

### 1. Création de `usageByUaiGlobal`

Nouvelle variable calculée sur **toutes les données** (`rowsWithDate`) au lieu des données filtrées :

```typescript
// VERSION GLOBALE : Pour les stats globales et distribution IPS
const usageByUaiGlobal = useMemo(() => {
  const m = groupCount(rowsWithDate, r => (r.uai || "").trim() || null);
  // ... calcul sur rowsWithDate
}, [rowsWithDate, annMap]);

// VERSION FILTRÉE : Pour la carte et le tableau (selon activité sélectionnée)
const usageByUai = useMemo(() => {
  const m = groupCount(filtered, r => (r.uai || "").trim() || null);
  // ... calcul sur filtered
}, [filtered, annMap]);
```

### 2. Modification de `globalStats`

Les statistiques globales utilisent maintenant `usageByUaiGlobal` :

```typescript
const globalStats = useMemo(() => {
  const totalEtablissements = usageByUaiGlobal.length; // ← Global
  
  for (const point of usageByUaiGlobal) { // ← Global
    // Comptage lycées/collèges
  }
  // ...
}, [rowsWithDate, usageByUaiGlobal, annMap]); // ← Dépendance mise à jour
```

**Impact** :
- ✅ `totalEtablissements` reste global
- ✅ `nombreLycees` reste global
- ✅ `nombreColleges` reste global
- ✅ Cohérence avec les autres stats globales

### 3. Modification de `ipsHistogram`

La distribution IPS utilise maintenant `usageByUaiGlobal` :

```typescript
const ipsHistogram = useMemo(() => {
  for (const point of usageByUaiGlobal) { // ← Global
    // Calcul bins IPS
  }
  // ...
}, [usageByUaiGlobal]); // ← Dépendance mise à jour
```

**Impact** :
- ✅ La distribution IPS ne change plus quand on filtre une activité
- ✅ Affiche toujours la distribution complète de tous les lycées

### 4. Vérification de `usageByAcademie`

Déjà global, aucune modification nécessaire :

```typescript
const usageByAcademie = useMemo(() => {
  for (const r of rowsWithDate) { // ← Déjà global
    // ...
  }
}, [rowsWithDate, annMap]);
```

## 📊 Résultat final

### ✅ Éléments GLOBAUX (ne changent jamais avec le filtre)

| Élément | Source de données |
|---------|-------------------|
| **Statistiques globales** | |
| - Nombre total d'usages | `rowsWithDate` |
| - Nombre d'élèves uniques | `rowsWithDate` |
| - Nombre d'établissements | `usageByUaiGlobal` |
| - Nombre de lycées | `usageByUaiGlobal` |
| - Nombre de collèges | `usageByUaiGlobal` |
| - Profs Publics | `rowsWithDate` |
| - Profs Privés | `rowsWithDate` |
| - Usages par année scolaire | `rowsWithDate` |
| **Graphiques** | |
| - Usages totaux par activité | `rowsWithDate` |
| - Distribution des IPS | `usageByUaiGlobal` |
| - Nombre d'activités par élève | `rowsWithDate` |
| - Usages par académie | `rowsWithDate` |
| **Modals** | |
| - Détails par établissement | `rowsWithDate` |
| - Évolution par académie | `rowsWithDate` |

### 🔍 Éléments FILTRÉS (changent avec le filtre)

| Élément | Source de données |
|---------|-------------------|
| - Évolution mensuelle | `filtered` → `monthlyAll` |
| - Carte des usages | `filtered` → `usageByUai` |
| - Tableau des lycées | `filtered` → `usageByUai` |
| - Compteur "Lignes usage" | `filtered.length` |

## 🎨 Comportement utilisateur

### Exemple : Sélection "Intro IA" dans le filtre

**Ce qui change** :
- 📈 Graphique "Évolution mensuelle" → Affiche uniquement les usages d'Intro IA
- 🗺️ Carte → Affiche uniquement les établissements ayant utilisé Intro IA
- 📋 Tableau lycées → Affiche uniquement les établissements ayant utilisé Intro IA
- 🔢 Compteur → "Lignes usage: 750 (sur 2103)"

**Ce qui ne change PAS** :
- ✅ Statistiques globales (2103 usages, 1859 élèves, 114 établissements, etc.)
- ✅ Graphique "Usages totaux par activité" (overview de toutes les activités)
- ✅ Distribution IPS (tous les lycées)
- ✅ Nombre d'activités par élève (distribution globale)
- ✅ Usages par académie (toutes les activités)

## 💡 Avantages

1. **Cohérence** : Les statistiques "globales" sont vraiment globales
2. **Contexte** : L'utilisateur garde toujours la vision d'ensemble
3. **Comparaison** : Facile de comparer une activité filtrée au total global
4. **Clarté** : Le filtre sert uniquement à zoomer sur l'analyse spatio-temporelle

## 🔧 Performance

- Pas d'impact significatif sur les performances
- Les calculs sont déjà mémoïsés avec `useMemo`
- Duplication de `usageByUai` négligeable (quelques Ko de RAM)

## 📝 Notes techniques

- `usageByUaiGlobal` et `usageByUai` ont la même structure, seule la source de données change
- Les dépendances des `useMemo` ont été correctement mises à jour
- Aucun warning TypeScript

## 🚀 Améliorations futures possibles

1. **Indicateurs visuels** : Ajouter des badges 🔍 pour indiquer les sections filtrées
2. **Tooltip explicatif** : Expliquer que les stats restent globales
3. **Mode "focus"** : Ajouter un toggle pour tout filtrer si besoin
