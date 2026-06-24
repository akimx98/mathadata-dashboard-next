# Correction : Unification des noms d'académies

## Date : 10 novembre 2025

## Problème identifié

**Confusion entre noms d'académies et régions académiques**

Depuis le **1er janvier 2020**, les académies de **Caen** et **Rouen** ont fusionné pour former l'**académie de Normandie**. Cependant, nos données utilisaient des sources différentes :

- **API data.education.gouv.fr** : utilise "Normandie" ✅
- **Fichier GeoJSON** (public/data/academies.geojson) : utilise encore "Académie de Caen" et "Académie de Rouen" ❌
- **Fichier statistiques** (public/data/academies_stats.json) : utilise "Normandie" ✅

Cette incohérence causait un problème de matching entre les données de la carte et les statistiques officielles.

## Liste officielle des 30 académies (depuis 2020)

### Métropole (26 académies)
1. Aix-Marseille
2. Amiens
3. Besançon
4. Bordeaux
5. Clermont-Ferrand
6. Corse
7. Créteil
8. Dijon
9. Grenoble
10. Lille
11. Limoges
12. Lyon
13. Montpellier
14. Nancy-Metz
15. Nantes
16. Nice
17. **Normandie** (fusion de Caen + Rouen)
18. Orléans-Tours
19. Paris
20. Poitiers
21. Reims
22. Rennes
23. Strasbourg
24. Toulouse
25. Versailles

### Outre-mer (4 académies + 1 vice-rectorat devenu académie)
26. Guadeloupe
27. Guyane
28. Martinique
29. La Réunion
30. Mayotte (vice-rectorat devenu académie de plein exercice en 2020)

### Vice-rectorats (non comptés comme académies)
- Nouvelle-Calédonie
- Polynésie Française
- Wallis-et-Futuna
- Saint-Pierre-et-Miquelon (rattaché à Normandie)

## Solution implémentée

### 1. Fonction de normalisation des noms (`Dashboard.tsx`)

```typescript
// Fonction pour normaliser les noms d'académies (gérer la fusion Caen/Rouen -> Normandie depuis 2020)
function normalizeAcademyName(name: string | undefined): string {
  if (!name) return "";
  const normalized = name.trim();
  // Gérer la fusion des académies de Caen et Rouen en Normandie (janvier 2020)
  if (normalized === "Caen" || normalized === "Rouen") {
    return "Normandie";
  }
  return normalized;
}
```

Cette fonction est appliquée lors du chargement des données de l'annuaire :
```typescript
academie: normalizeAcademyName(String(r.academie ?? ""))
```

### 2. Mapping dans la carte (`UsageMap.tsx`)

```typescript
// Extraire le nom court de l'académie pour matcher avec les stats
// Ex: "Académie d'Aix-Marseille" -> "Aix-Marseille"
let academyShortName = name.replace(/^Académie (d'|de |des |du |de la )/i, '');

// Gérer la fusion Caen/Rouen -> Normandie (depuis 2020)
if (academyShortName === "Caen" || academyShortName === "Rouen") {
  academyShortName = "Normandie";
}
```

### 3. Données statistiques mises à jour

Le fichier `public/data/academies_stats.json` contient maintenant l'entrée "Normandie" avec les données consolidées :

```json
"Normandie": {
  "nb_colleges": 394,
  "nb_lycees_gt": 62,
  "nb_lycees_pro": 87,
  "nb_lycees_total": 238,
  "nb_eleves_gt": 449818,
  "nb_eleves_pro": 184642,
  "nb_eleves_total": 634460
}
```

## Résultats

✅ **30 académies** correctement identifiées et unifiées
✅ Matching parfait entre :
  - Les données d'usage MathAData
  - Les statistiques officielles de l'Éducation Nationale
  - Les frontières géographiques affichées sur la carte
✅ Les tooltips et modaux affichent les bonnes données pour "Normandie"
✅ Pas de duplication ou de données manquantes

## Points d'attention

### GeoJSON ancien
Le fichier `public/data/academies.geojson` contient encore les anciennes académies de Caen et Rouen. Le code gère cette situation via le mapping, mais idéalement il faudrait :
- Soit obtenir un GeoJSON mis à jour avec l'académie de Normandie fusionnée
- Soit fusionner programmatiquement les deux polygones

### Sources de données
- **API data.education.gouv.fr** : déjà à jour avec "Normandie"
- **Fichiers CSV locaux** : maintenant normalisés au chargement
- **GeoJSON** : ancien mais géré par mapping

## Vérification

Pour vérifier que tout fonctionne :
1. Activer "Vue par académies" sur la carte
2. Survoler la Normandie (zones de Caen et Rouen)
3. Vérifier que les statistiques affichées sont identiques pour les deux zones
4. Cliquer sur l'une des zones et vérifier que le modal "Académie de Normandie" s'ouvre

## Références

- [Décret n° 2019-1056 du 15 octobre 2019 portant création de l'académie de Normandie](https://www.legifrance.gouv.fr/jorf/id/JORFTEXT000039266614)
- [Wikipedia - Académie (éducation en France)](https://fr.wikipedia.org/wiki/Acad%C3%A9mie_(%C3%A9ducation_en_France))
- [data.gouv.fr - Contours géographiques des académies](https://www.data.gouv.fr/fr/datasets/contours-geographiques-des-academies/)
