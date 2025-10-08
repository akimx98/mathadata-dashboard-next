# Configuration des noms courts des activités

## Comment personnaliser les noms des activités

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

Dans le fichier `components/Dashboard.tsx`, modifiez l'objet `ACTIVITY_SHORT_NAMES` (lignes 34-45) :

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
