# Définitions canoniques — enquête usages MathAData (extraction 2026-06-19)

## Fichiers (chemins absolus)
- Brut : `/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/capytale_fresh_20260619.csv` (7353 lignes)
- Annuaire : `/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/annuaire_etablissements.csv`
- Tables canoniques : `/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/data/`
  - `usages_enriched.csv` (1 ligne = 1 affectation, enrichie : rôle, dates Paris, année scolaire `sy`, `act_label/act_level/act_theme`, attributs établissement él. `el_*` et prof `th_*`, `teacher_uai`, `session_id`)
  - `teachers.csv` (1 ligne = 1 prof `teacher`)
  - `establishments.csv` (1 ligne = 1 UAI prof de référence)
  - `sessions.csv` (1 ligne = 1 séance détectée)
  - `facts.json` (chiffres déjà calculés — source de vérité)

## Règles métier (À RESPECTER STRICTEMENT pour cohérence)
- **Usage** = 1 ligne = 1 affectation Capytale clonée. Ce n'est ni un utilisateur, ni une séance.
- **Rôle** : `student` (clone élève), `teacher` (clone/test prof), vide (indéterminé).
- **Compte démo à EXCLURE** : `teacher == c81e728d9d4c2f636f067f89cc14862c` (= MD5 "2") = 195 lignes rôle-vide, sans UAI. Exclu de tous les KPI.
- **Compte pionnier à SIGNALER** : `teacher == cfcd208495d565ef66e7dff9f98764da` (= MD5 "0") = compte historique, 404 élèves, Haubourdin (Lille), actif 2023-2026. À isoler dans l'histoire géographique et la concentration.
- **Prof** = identifiant `teacher`. Tests d'un prof = ses lignes `role=teacher`. Élèves d'un prof = ses lignes `role=student`.
- **Année scolaire `sy`** : `sy = année si mois>=8 sinon année-1` → format `2024-2025`. Dates converties en Europe/Paris.
- **Comportement prof** :
  - `testé_seulement` : a testé (≥1 ligne teacher), n'a jamais d'élève. (= testeur non converti)
  - `testé_puis_enseigné` : a testé ET enseigné, 1er test ≤ 1er élève.
  - `enseigné_sans_test` : a des élèves, aucune ligne teacher.
  - `enseigné_puis_testé` : a testé ET enseigné mais 1er test > 1er élève (≈ a enseigné sans test préalable ; le test porte souvent sur une activité déjà enseignée).
  - Regroupement « intention avant 1ère classe » : A=testé jamais enseigné ; B=testé PUIS enseigné ; C=enseigné sans test préalable (= enseigné_sans_test + enseigné_puis_testé).
- **Séance** : run maximal de clones ÉLÈVES de même `teacher` + même `mathadata_id` + même `uai_el`, dont les créations consécutives sont espacées de < 3 h.
- **« Classe »** (vraie séance avec groupe) : séance ≥ 10 élèves (taille médiane ≈ 17). Les séances à 1 élève (220) sont des tests/élèves isolés, pas des classes.
- **Établissement du prof** : `uai_teach` modal non vide, sinon `uai_el` modal de ses élèves. Type/secteur/académie/IPS via annuaire (99,7 % de correspondance).
- **IPS** : indice de position sociale (lycées). Baseline national lycées : moyenne 107,0 / médiane 105,7.

## Caveats interprétatifs
- « Test » = clone `role=teacher` capturé. Un prof peut s'approprier une activité sans cloner (donc « enseigné sans test » sur-estime peut-être l'adoption directe).
- 2025-2026 est **incomplète** (extraction au 19 juin) : comparaisons inter-années à pondérer, mais l'essentiel de l'année est couvert.
- Identifiants pseudonymisés = sensibles ; ne jamais tenter de ré-identifier.
