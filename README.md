# Dashboard MathAData - Next.js

Application interactive de visualisation des usages de la plateforme MathAData en établissements
scolaires, déployée sur [Vercel](https://mathadata-dashboard-next.vercel.app/).

> Les analyses reproductibles, le glossaire canonique, les rapports et les GitHub Pages vivent
> désormais dans [`mathadata/enquete-usages`](https://github.com/mathadata/enquete-usages) et sur
> [`mathadata.github.io/enquete-usages`](https://mathadata.github.io/enquete-usages/).
> Cette application conserve ses calculs interactifs historiques ; leur alignement avec les
> définitions canoniques sera traité séparément.

## Objectif

Explorer et visualiser interactivement les usages MathAData dans les lycées et collèges français :
- Adoption par les enseignants (test vs enseignement)
- Engagement des élèves (continuité, travail à domicile, 2èmes séances)
- Succès des activités pédagogiques
- Distribution géographique et sociale (IPS)

## Fonctionnalités principales

### Statistiques globales
- **Métriques d'usage** : Nombre total d'usages, élèves uniques, séances détectées
- **Comportement enseignant** : 
  - Profs qui ont testé puis enseigné
  - Profs qui ont enseigné sans tester
  - Profs qui ont testé mais pas enseigné
- **Statistiques établissement** : Lycées, collèges, profs publics/privés
- **Distribution IPS** : Histogramme des indices de position sociale des lycées

### Carte interactive
- Visualisation géographique des usages par établissement
- Cercles proportionnels au nombre d'usages
- Code couleur : vert = usage avec élèves, rouge = tests enseignants uniquement
- Filtrage par activité

### Tableau des établissements
- Tri par séances, élèves, profs, IPS
- Nombre de profs enseignant vs testant
- Modal détaillé par établissement :
  - Séances par professeur (avec analyse détaillée)
  - Tests enseignants
  - Identifiants professeurs cohérents entre sections

### Histogrammes
- **Activités par élève** : Distribution du nombre d'activités testées par élève
- **Séances par professeur** : Distribution du nombre de séances animées
  - Modal interactif avec détails par prof (lycées, activités, timeline)

### Tableau de succès des activités
11 indicateurs par activité :
- **Adoption** : Lycées, séances, profs, élèves
- **Engagement** : Taille classe, reprise >1h, travail à domicile, 2ème séance
- **Fidélisation** : Séances par prof
- **Conversion** : Taux usage après test (test → enseignement)

## Technologies

- **Framework** : Next.js 15
- **UI** : React, TypeScript
- **Visualisation** : Recharts, Leaflet (cartes)
- **Styling** : CSS modules, Tailwind

## Démarrage

```bash
# Installation reproductible
npm ci

# Développement
npm run dev

# Build production
npm run build
npm start
```

Ouvrir [http://localhost:3000](http://localhost:3000)

### Synchronisation Capytale

Le bouton **Charger les données les plus récentes** appelle Capytale depuis le serveur,
normalise le CSV puis le stocke dans Vercel Blob. L'import manuel reste disponible pour
afficher un ancien export CSV.

Configurer la variable suivante en local dans `.env.local` et dans les variables
d'environnement du projet Vercel :

```bash
CAPYTALE_MATHADATA_TOKEN=...
```

L'URL peut être remplacée avec `CAPYTALE_MATHADATA_URL`; sinon le endpoint MathAData
Capytale est utilisé par défaut. Le jeton n'est jamais envoyé au navigateur.

En production, `BLOB_READ_WRITE_TOKEN` est fourni par l'intégration Vercel Blob et permet de
conserver le CSV synchronisé et ses métadonnées. Sans cette variable, le développement local écrit
dans `storage/`, ignoré par Git. Si aucune donnée persistée n'existe, l'API utilise
`public/data/Mathadata20260210.csv`.

La structure et le sens métier du CSV source sont décrits dans
[DONNEES_BRUTES_CAPYTALE.md](DONNEES_BRUTES_CAPYTALE.md).

## Structure des données

### Source

Source principale : API CSV Capytale MathAData. Le fichier
`public/data/Mathadata20260210.csv` sert uniquement de fallback si aucune donnée
persistée n'est disponible.

### Colonnes principales
- `student` : ID anonymisé de l'élève/prof
- `teacher` : ID anonymisé du professeur
- `role` / `Role` : "student" (usage classe) ou "teacher" (test prof)
- `mathadata_id` : Identifiant de l'activité
- `uai` / `uai_el` : UAI de l'établissement de l'élève
- `uai_teach` : UAI de l'établissement du professeur
- `created` : Timestamp création (secondes, epoch unix)
- `changed` : Timestamp dernière modification (secondes, epoch unix)

### Annuaire établissements
Fichier : `public/data/annuaire_etablissements.csv`
- Nom, ville, académie, type (lycée/collège), secteur (public/privé)
- IPS (Indice de Position Sociale) pour les lycées
- Coordonnées GPS (latitude, longitude)

## Algorithmes clés

### Détection des séances
**Clustering temporel avec fenêtre de 1 heure** :
- Groupe les sessions d'élèves par `(uai, teacher, mathadata_id)`
- Sessions créées à <1h d'intervalle = même séance
- Permet de détecter les classes qui travaillent ensemble

### Détection des 2èmes séances
**Reprise collective** :
- Au moins 2 élèves modifient leur travail >1h après la séance initiale
- Modifications groupées dans une fenêtre de 1h
- Indique un suivi pédagogique ou un travail à domicile collectif

### Analyse du comportement enseignant
Pour chaque prof :
1. Recherche première session "teacher" (test)
2. Recherche première session "student" (enseignement)
3. Classification selon chronologie :
   - Test avant enseignement → "Testé puis enseigné" ✅
   - Enseignement sans test préalable → "Enseigné sans tester" ⚠️
   - Test uniquement → "Testé mais pas enseigné" ❌

### Taux usage après test (par activité)
```typescript
nbProfsTestedThenTaught = profs avec Role="teacher" puis Role="student"
nbProfsTested = profs avec Role="teacher"
tauxUsageApresTest = (nbProfsTestedThenTaught / nbProfsTested) * 100
```

## 🎨 Code couleur

### Tableaux
- 🟢 Vert : Excellent (seuils hauts dépassés)
- 🟠 Orange : Bon (seuils moyens dépassés)
- 🔴 Rouge : Faible (sous les seuils)

### Carte
- 🟢 Vert : Établissement avec usage élèves
- 🔴 Rouge : Établissement avec tests enseignants uniquement

### Seuils par métrique
- **Reprise >1h** : 40% excellent, 20% bon
- **Travail à domicile** : 25% excellent, 10% bon
- **2ème séance** : 30% excellent, 15% bon
- **Taux usage après test** : 75% excellent, 50% bon

## 📝 Fichiers principaux

### Code
- `components/Dashboard.tsx` : composant principal et logique interactive
- `app/api/csv/route.ts` : lecture, synchronisation Capytale et persistance du CSV
- `app/page.tsx` : Page d'accueil
- `app/globals.css` : Styles globaux

### Documentation
- `CONFIGURATION_ACTIVITES.md` : Configuration des activités MathAData
- `DONNEES_BRUTES_CAPYTALE.md` : Schéma et récupération des données consommées par l'application
- [`mathadata/enquete-usages`](https://github.com/mathadata/enquete-usages) : analyses canoniques

## 🔍 Points d'attention

### Timestamps
⚠️ **Important** : Les timestamps du CSV sont en **secondes** (epoch unix)
- Toujours multiplier par 1000 avant `new Date(timestamp)`
- Exemple : `new Date(created * 1000)`

### UAI
- `uai_teach` : Où le prof travaille (utilisé pour tests enseignants)
- `uai_el` : Où l'élève étudie (utilisé pour usages en classe)
- Les deux peuvent différer (ex: prof remplaçant)

### Rôles
- `Role="teacher"` : Prof teste seul l'activité
- `Role="student"` : Élève utilise l'activité (en classe ou à domicile)

## Métriques calculées à l'exécution

### Niveau global
- affectations et comptes pseudonymisés distincts ;
- séances reconstruites et taille moyenne ;
- reprises collectives et deuxièmes séances ;
- comportement de test puis d'enseignement.

Les valeurs dépendent du CSV actuellement stocké dans Vercel Blob ou, à défaut, du fichier fallback.
Ne pas recopier de chiffres de cette interface dans un rapport canonique : utiliser
[`mathadata/enquete-usages`](https://github.com/mathadata/enquete-usages).

### Par établissement
- Nombre de séances
- Nombre d'élèves uniques
- Nombre de profs enseignant
- Nombre de profs testant
- IPS (si lycée)

### Par activité
- 11 indicateurs de succès
- Adoption, engagement, fidélisation
- Taux de conversion test → enseignement

## Limitations connues

1. **Clustering** : Une classe peut être divisée en 2 séances si >1h entre premiers et derniers élèves
2. **UAI NULL** : Profs sans UAI sont classés "Privé" par défaut
3. **Multi-établissements** : Un prof enseignant dans 2 établissements = 2 séances distinctes (voulu)

## Ressources

- [Analyses canoniques et GitHub Pages](https://github.com/mathadata/enquete-usages)
- [Next.js Documentation](https://nextjs.org/docs)
- [Recharts Documentation](https://recharts.org/)
- [Leaflet Documentation](https://leafletjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
