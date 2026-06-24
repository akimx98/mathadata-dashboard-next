---
name: analyse-usages-mathadata
description: Répondre aux questions d'analyse sur les usages MathAData dans enquete_usages_2026, y compris les croisements site–Capytale et les demandes nominatives internes. Utiliser cette skill dès qu'une demande mentionne des profs, usages, activités, classes, formations, canaux, retours, cohortes, données Payload/Capytale, noms ou e-mails.
---

# Analyse des usages MathAData

## But

Produire une réponse reproductible sans inventer de catégorie, sans mélanger les grains et sans
faire sortir de données personnelles du périmètre local autorisé.

## Ordre de lecture obligatoire

1. Lire `enquete_usages_2026/transverse/GLOSSAIRE.md`.
2. Lire `CLAUDE.md` §10-11.
3. Lire [references/clarification.md](references/clarification.md).
4. Pour une demande nominative ou un croisement individuel, lire aussi
   [references/mode-nominatif-local.md](references/mode-nominatif-local.md).

## Workflow

1. Reformuler l'interprétation opérationnelle : population, période, événement, seuil, grain,
   dénominateur et sensibilité de la sortie.
2. Appliquer le protocole de clarification. Ne poser une question que si plusieurs interprétations
   plausibles changent matériellement le résultat.
3. Chercher le résultat dans les `facts_*.json`, puis dans les tables canoniques. Ne pas recalculer
   un fait existant.
4. Si un calcul ad hoc est nécessaire, le faire dans `/tmp` ou `enquete_usages_2026/_local/`.
   Une variable durable de profil doit être ajoutée à `transverse/build_profiles.py`.
5. Contrôler les exclusions, le grain et les bornes temporelles. Tout lien site–Capytale est
   estimé ; donner la couverture et la confiance utilisées.
6. Répondre avec quatre blocs courts : **Interprétation**, **Résultat**, **Base et méthode**,
   **Limites**. Pour une liste nominative, ajouter **Destination et confidentialité**.

## Règles de décision

- Si les mots de l'utilisateur correspondent sans ambiguïté au glossaire, annoncer cette lecture
  et calculer.
- Si une expression est proche d'un terme canonique mais différente, ne pas les assimiler.
  Exemple : « plusieurs activités différentes » n'est pas automatiquement « usage multiple »,
  qui autorise plusieurs occasions de la même activité.
- Si la catégorie demandée n'existe pas, proposer soit la catégorie canonique la plus proche, soit
  une catégorie exploratoire explicitement nommée. Ne pas modifier le glossaire sans demande.
- Si les données nécessaires sont absentes du clone, l'indiquer précisément. Ne pas remplacer une
  absence par une hypothèse silencieuse.
- Ne jamais présenter un appariement nominatif site–Capytale comme certain. Séparer les résultats
  mesurés sur le site des résultats issus d'un appariement A/B.

## Interdictions

- Ne jamais écrire nom, prénom, e-mail ou identifiant Payload dans un fichier suivi par Git, un
  dashboard, un rapport publiable, un log versionné ou une sortie de CI.
- Ne jamais publier une table nominative, même pseudonymisée si la table permet une réidentification
  raisonnable par croisement.
- Ne jamais utiliser `n_teacher_clones` comme nombre de profs.
- Ne jamais mélanger réutilisation intra-annuelle et retour interannuel.
- Ne jamais appeler « absence de trace site » une preuve certaine d'arrivée directe par Capytale.
