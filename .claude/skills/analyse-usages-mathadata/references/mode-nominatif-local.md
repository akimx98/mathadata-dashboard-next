# Mode nominatif local

## Périmètre autorisé

Les analyses nominatives internes sont autorisées lorsqu'elles sont explicitement demandées par
l'utilisateur dans le cadre de l'étude. Elles utilisent les sources locales auxquelles l'équipe est
habilitée. Cette autorisation ne vaut jamais autorisation de versionner, publier ou transmettre les
données.

Un clone seul ne contient volontairement pas les sources nominatives. Le collègue doit disposer :

- d'un snapshot Payload local autorisé ;
- de `MATHADATA_SNAPSHOT` pointant vers ce snapshot si le chemin par défaut n'existe pas ;
- des fichiers de travail dans `enquete_usages_2026/_local/`, régénérés localement si nécessaire.

## Ne pas reconstruire inutilement les analyses

- Pour une question nominative portant uniquement sur le site, lire directement
  `$MATHADATA_SNAPSHOT/users.json`. Aucun pipeline n'est nécessaire.
- Pour rattacher les identités Payload aux profils Capytale déjà versionnés, générer uniquement le
  pont local :

  `python3 enquete_usages_2026/site-vers-classe/match_individuals.py --local-only`

  Cette commande écrit `_local/match_nominatif.csv` sans modifier les faits, profils ou sorties
  versionnés.
- Ne lancer `rebuild_all.sh` que si l'utilisateur demande d'actualiser ou de recalculer les
  analyses sur un nouveau snapshot ou un nouveau CSV Capytale.

## Avant le calcul

1. Confirmer dans la réponse de travail que la demande est **nominative et interne**.
2. Définir les champs nécessaires : préférer nom + e-mail ; ne pas extraire d'autres champs sans
   besoin.
3. Définir la destination :
   - affichage limité dans la réponse si demandé ;
   - fichier sous `enquete_usages_2026/private/` pour un livrable humain ;
   - fichier sous `enquete_usages_2026/_local/` pour un intermédiaire de calcul.
4. Pour tout fichier, vérifier avant écriture que la destination est ignorée :

   `git check-ignore -q <chemin>`

5. Si la destination n'est pas ignorée, arrêter et proposer un chemin privé. Ne jamais ajouter une
   exception à `.gitignore` pour contourner cette règle.

## Pendant le calcul

- Lire le minimum de colonnes nominatives requis.
- Utiliser `/tmp` ou `_local/` pour les jointures temporaires.
- Ne pas afficher de dump brut dans les logs de commande.
- Ne pas confondre :
  - identité mesurée côté site ;
  - identité Capytale inférée par appariement A/B.
- Pour une liste issue de l'appariement, inclure `match_confidence` et la règle A/B, ou filtrer sur
  A si l'utilisateur demande un niveau de certitude élevé.
- Si la couverture d'appariement ne permet pas de répondre pour toute la population, fournir deux
  chiffres : population totale répondant au critère côté Capytale et sous-ensemble nominativement
  attribuable.

## Avant de rendre le résultat

1. Vérifier qu'aucun fichier nominatif n'apparaît dans `git status --short`.
2. Vérifier qu'aucune donnée nominative n'a été ajoutée aux fichiers versionnés modifiés.
3. Donner la source, la date d'extraction, la taille de la population et la confiance.
4. Marquer explicitement la sortie : « usage interne — données personnelles — ne pas publier ».

Une liste nominative ne doit jamais être copiée dans `data/`, un rapport versionné, un dashboard,
une issue, une pull request, un commit, un artefact publié ou une sortie de CI.
