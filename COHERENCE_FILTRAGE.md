# Cohérence du filtrage par activité

## 📊 État actuel du dashboard

### 🎯 **Éléments qui DÉPENDENT du filtre "Activité"**

Ces éléments utilisent la variable `filtered` qui change selon l'activité sélectionnée :

| Section | Élément | Variable source | Comportement |
|---------|---------|----------------|--------------|
| **Graphiques** | Évolution mensuelle | `monthlyAll` → `filtered` | ✅ Se met à jour selon le filtre |
| **Carte** | Carte des usages | `usageByUai` → `filtered` | ✅ Se met à jour selon le filtre |
| **Tableau** | Lycées - usages | `usageByUai` → `filtered` | ✅ Se met à jour selon le filtre |
| **Stats** | Lignes usage (en haut) | `filtered.length` | ✅ Affiche le nombre filtré |

#### Détails techniques :
```typescript
const filtered = useMemo(() => {
  if (activityFilter === "__ALL__") return rowsWithDate;
  return rowsWithDate.filter(r => r.mathadata_id === activityFilter);
}, [rowsWithDate, activityFilter]);

// Utilisé par :
const monthlyAll = useMemo(() => { /* ... */ }, [filtered]);
const usageByUai = useMemo(() => { /* ... */ }, [filtered, annMap]);
const ipsHistogram = useMemo(() => { /* ... */ }, [usageByUai]); // Indirect
```

---

### 🌍 **Éléments qui NE DÉPENDENT PAS du filtre (toujours globaux)**

Ces éléments utilisent `rowsWithDate` (toutes les données) :

| Section | Élément | Variable source | Comportement |
|---------|---------|----------------|--------------|
| **Graphiques** | Usages totaux par activité | `usageByActivity` → `rowsWithDate` | ❌ Toujours global |
| **Graphiques** | Nombre d'activités par élève | `activitiesPerStudent` → `rowsWithDate` | ❌ Toujours global |
| **Graphiques** | Usages par académie | `usageByAcademie` → `rowsWithDate` | ❌ Toujours global |
| **Graphiques** | Distribution des IPS | `ipsHistogram` → `usageByUai` | ⚠️ **DÉPEND indirectement** |
| **Stats globales** | Nombre total d'usages | `globalStats.totalUsages` → `rowsWithDate` | ❌ Toujours global |
| **Stats globales** | Nombre d'élèves uniques | `globalStats.totalElevesUniques` → `rowsWithDate` | ❌ Toujours global |
| **Stats globales** | Nombre d'établissements | `globalStats.totalEtablissements` → `usageByUai` | ⚠️ **DÉPEND indirectement** |
| **Stats globales** | Nombre de lycées | `globalStats.nombreLycees` → `usageByUai` | ⚠️ **DÉPEND indirectement** |
| **Stats globales** | Nombre de collèges | `globalStats.nombreColleges` → `usageByUai` | ⚠️ **DÉPEND indirectement** |
| **Stats globales** | Profs Publics | `globalStats.nombreProfsPublics` → `rowsWithDate` | ❌ Toujours global |
| **Stats globales** | Profs Privés | `globalStats.nombreProfsPrives` → `rowsWithDate` | ❌ Toujours global |
| **Stats globales** | Usages par année scolaire | `globalStats.usages2023_2024` etc. → `rowsWithDate` | ❌ Toujours global |
| **Modals** | Détails activités par établissement | `getActivityDetailsForUai()` → `rowsWithDate` | ❌ Toujours global |
| **Modals** | Évolution par académie | `getMonthlyDataForAcademie()` → `rowsWithDate` | ❌ Toujours global |

---

## ⚠️ **INCOHÉRENCE DÉTECTÉE**

### Problème n°1 : Distribution des IPS
**Statut** : ⚠️ Dépend du filtre (indirectement via `usageByUai`)
**Impact** : Le graphique IPS change selon l'activité sélectionnée
**Question** : Est-ce le comportement souhaité ?

### Problème n°2 : Statistiques globales partiellement filtrées
Les stats "globales" sont **partiellement incohérentes** :
- ❌ `totalEtablissements`, `nombreLycees`, `nombreColleges` → Filtrés (via `usageByUai`)
- ✅ `totalUsages`, `totalElevesUniques`, profs publics/privés → Globaux (via `rowsWithDate`)

**Exemple concret** :
- Si je filtre sur "Intro IA" :
  - ✅ "Nombre total d'usages" reste global (2103)
  - ⚠️ "Nombre d'établissements" devient filtré (seulement ceux ayant utilisé "Intro IA")

### Problème n°3 : Graphiques toujours globaux
Ces graphiques ne réagissent **jamais** au filtre :
- "Usages totaux par activité" (normal, c'est un overview)
- "Nombre d'activités par élève" (pourrait être filtré)
- "Usages par académie" (devrait être filtré ?)

---

## 🎯 **RECOMMANDATIONS**

### Option 1️⃣ : Tout filtrer (cohérence maximale)
**Principe** : Quand je sélectionne une activité, TOUTE la page se filtre dessus

✅ **Avantages** :
- Cohérence totale
- Permet d'analyser une activité spécifique en profondeur

❌ **Inconvénients** :
- Perte de vision globale
- "Usages totaux par activité" devient redondant si filtré

**À modifier** :
```typescript
// Passer tous les calculs de rowsWithDate → filtered
const globalStats = useMemo(() => { /* ... */ }, [filtered, usageByUai, annMap]);
const usageByAcademie = useMemo(() => { /* ... */ }, [filtered, annMap]);
const activitiesPerStudent = useMemo(() => { /* ... */ }, [filtered]);
// etc.
```

---

### Option 2️⃣ : Tout globaliser (logique actuelle améliorée)
**Principe** : Le filtre n'affecte que les sections d'analyse détaillée (carte, tableau, évolution temporelle)

✅ **Avantages** :
- Stats globales restent stables (contexte)
- Permet de comparer une activité au global

❌ **Inconvénients** :
- Moins intuitif pour l'utilisateur
- Le filtre semble "ne pas marcher" sur certaines sections

**À modifier** :
```typescript
// Découpler usageByUai de filtered (utiliser rowsWithDate)
const usageByUai = useMemo(() => {
  const m = groupCount(rowsWithDate, r => (r.uai || "").trim() || null);
  // ...
}, [rowsWithDate, annMap]);

// Mais créer une version filtrée pour la carte uniquement
const usageByUaiFiltered = useMemo(() => {
  const m = groupCount(filtered, r => (r.uai || "").trim() || null);
  // ...
}, [filtered, annMap]);
```

---

### Option 3️⃣ : Deux sections distinctes ⭐ RECOMMANDÉ
**Principe** : Séparer visuellement les sections globales des sections filtrées

**Structure suggérée** :
```
┌─────────────────────────────────────────┐
│ 📊 STATISTIQUES GLOBALES (toujours)     │
│ - Total usages, élèves, profs           │
│ - Usages par activité                   │
│ - Usages par académie                   │
│ - Nombre d'activités par élève          │
│ - Distribution IPS globale              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 🔍 ANALYSE PAR ACTIVITÉ (filtrable)     │
│ [Sélecteur d'activité]                  │
│ - Évolution mensuelle (filtrée)         │
│ - Carte des usages (filtrée)            │
│ - Tableau des établissements (filtré)   │
└─────────────────────────────────────────┘
```

✅ **Avantages** :
- Clarté maximale pour l'utilisateur
- Pas de perte d'information
- UX intuitive

❌ **Inconvénients** :
- Nécessite un refactoring de la mise en page

---

## 🚀 **SOLUTION RAPIDE (Quick Fix)**

Ajouter un **indicateur visuel** pour clarifier ce qui est filtré :

```tsx
<h2>
  Évolution mensuelle — {activityFilter === "__ALL__" ? "toutes activités" : "..."}
  <span style={{color: "#3b82f6"}}>🔍 Filtré</span>
</h2>

<h2>
  Usages par académie
  <span style={{color: "#64748b"}}>🌍 Global</span>
</h2>
```

---

## 📋 **RÉSUMÉ**

| Section | Filtrée ? | Devrait l'être ? |
|---------|-----------|------------------|
| Évolution mensuelle | ✅ Oui | ✅ Oui |
| Carte des usages | ✅ Oui | ✅ Oui |
| Tableau lycées | ✅ Oui | ✅ Oui |
| Usages par activité | ❌ Non | ❌ Non (overview) |
| Usages par académie | ❌ Non | ⚠️ **À décider** |
| Activités par élève | ❌ Non | ⚠️ **À décider** |
| Distribution IPS | ⚠️ Indirect | ⚠️ **À décider** |
| Stats globales | ⚠️ Mixte | ❌ Non |
| Modals | ❌ Non | ❌ Non |

**Verdict** : Incohérence actuelle nécessite une clarification du comportement souhaité.
