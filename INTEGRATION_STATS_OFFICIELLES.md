# Intégration des Statistiques Officielles des Académies

## Date : 10 novembre 2025

## Fichiers modifiés

### 1. `/public/data/academies_stats.json` (NOUVEAU)
Fichier de données officielles pour les 34 académies françaises :
- **Nombre total de lycées** par académie
- **Effectifs élèves lycées GT** (généraux et technologiques)
- **Effectifs élèves lycées Pro** (professionnels)
- **Total élèves** (GT + Pro)

**Source des données** : API data.education.gouv.fr
- Dataset établissements : `fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre`
- Dataset effectifs GT : `fr-en-lycee_gt-effectifs-niveau-sexe-lv`
- Dataset effectifs Pro : `fr-en-lycee_pro-effectifs-niveau-sexe-lv`

### 2. `/components/UsageMap.tsx`
Modifications pour afficher les statistiques officielles dans les tooltips de la carte :

**Ajouts :**
- State `officialStats` pour stocker les données officielles
- useEffect pour charger `/data/academies_stats.json`
- Tooltip enrichi affichant :
  - Total lycées dans l'académie (données officielles)
  - Total élèves dans l'académie (données officielles)
  - Nombre de lycées utilisant MathAData avec **pourcentage d'adoption**
  - Usages et sessions élèves MathAData

**Exemple de tooltip :**
```
🏫 214 lycées au total
▸ 604 852 élèves

📊 45 utilisant MathAData (21.0%)
▸ 15 234 usages
▸ 8 456 sessions élèves
```

### 3. `/components/Dashboard.tsx`
Modifications pour afficher les statistiques officielles dans le modal académie :

**Ajouts :**
- State `officialAcademyStats` pour stocker les données officielles
- useEffect pour charger `/data/academies_stats.json` au montage du composant
- Section "Statistiques officielles" dans le modal avec :
  - Total lycées de l'académie
  - Total élèves (avec détail GT/Pro)
- Calcul du **taux d'adoption** : pourcentage de lycées utilisant MathAData

**Affichage dans le modal :**

**Section 1 : Statistiques officielles** (fond gris clair)
- Total lycées : 214
- Total élèves : 604 852 (dont 432 226 en GT, 172 626 en Pro)

**Section 2 : Statistiques MathAData**
- Lycées utilisant MathAData : 45 (21.0%)
- Total usages : 15 234
- Élèves uniques : 8 456

## Données clés

### Top 5 académies (nombre de lycées)
1. **Versailles** : 323 lycées, 1 282 638 élèves
2. **Nantes** : 271 lycées, 730 973 élèves
3. **Créteil** : 269 lycées, 994 648 élèves
4. **Lille** : 277 lycées, 879 470 élèves
5. **Bordeaux** : 251 lycées, 638 610 élèves

### Plus petites académies
- **Saint Pierre et Miquelon** : 1 lycée, 1 303 élèves
- **Wallis et Futuna** : 2 lycées, 3 020 élèves
- **Mayotte** : 15 lycées, 111 836 élèves
- **Corse** : 20 lycées, 52 174 élèves

## Bénéfices de l'intégration

1. **Contextualisation** : Les données MathAData sont maintenant présentées en contexte avec les chiffres officiels de l'Éducation Nationale
2. **Taux d'adoption** : Calcul automatique du pourcentage de lycées utilisant MathAData dans chaque académie
3. **Comparaison** : Possibilité de comparer l'usage de MathAData avec la taille réelle de chaque académie
4. **Transparence** : Affichage clair des données officielles vs données d'usage
5. **Prise de décision** : Aide à identifier les académies avec un fort/faible taux d'adoption

## Tests recommandés

1. ✅ Vérifier l'affichage des tooltips sur la carte en survolant les académies
2. ✅ Cliquer sur une académie pour voir le modal avec les statistiques complètes
3. ✅ Vérifier le calcul du pourcentage d'adoption
4. ✅ Tester avec différentes académies (grandes et petites)
5. ✅ Vérifier la cohérence des données affichées

## Commandes de lancement

```bash
npm run dev
# Application disponible sur http://localhost:3001
```

## Notes techniques

- Les données officielles sont chargées **en lazy loading** uniquement quand `showAcademyBorders` est activé
- Le matching entre noms d'académies se fait en normalisant les noms (suppression de "Académie d'|de|des|du")
- Gestion des cas où les statistiques officielles ne sont pas disponibles (fallback sur données MathAData uniquement)
- Format des nombres : utilisation de `toLocaleString('fr-FR')` pour l'affichage français
