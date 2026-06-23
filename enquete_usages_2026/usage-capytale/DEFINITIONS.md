# Définitions de source — VOLET 1 (Capytale) — extraction 2026-06-19

> ⚠️ **Le sens des termes transverses est désormais centralisé dans
> [`../transverse/GLOSSAIRE.md`](../transverse/GLOSSAIRE.md)** (source de vérité unique). Ce fichier ne
> garde que les **spécificités de source** (chemins, schémas, détection de séances).
> **Divergence connue à réconcilier** : ci-dessous « classe » = séance ≥ 10 él. ; le **glossaire**
> fixe désormais le seuil canonique à **≥ 5 él.** (+ bande « sous-seuil » 1-4). Les chiffres de ce
> volet calculés sur l'ancien seuil sont à recalculer lors de la passe de mise en cohérence.

---

## (historique) Définitions canoniques — enquête usages MathAData (extraction 2026-06-19)

## Fichiers (chemins absolus)
- Brut : `/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/capytale_fresh_20260619.csv` (7353 lignes)
- Annuaire : `/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/public/data/annuaire_etablissements.csv`
- Tables canoniques : `/Users/akim/Documents/MathAData_Git/mathadata-dashboard-next/enquete_usages_2026/usage-capytale/data/`
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

## Modèle des comptes (ajout du 20 juin 2026 — important)
- **`role` = TYPE du compte Capytale**, pas la position dans la chaîne : compte enseignant → `role=teacher` ; compte élève → `role=student`. Vérifié : sur 6810 lignes élèves, `student==teacher` 0 fois et 0 id élève n'est un id prof ; sur les lignes test, `student==teacher` 51 %.
- **Conséquence** : un prof **en formation** clone le code du formateur mais reste `role=teacher`. Son id va dans la colonne **`student`** (clone-owner), son établissement dans **`uai_el`**, le **formateur** dans `teacher`. Les profs-stagiaires n'apparaissent donc **jamais** comme `role=student`.
- **`role=student` = vrais élèves** (population propre, ~5854). Les KPI élèves ne sont pas contaminés.
- **Population enseignante « engagée »** = `distinct(colonne teacher)` ∪ `distinct(student sur lignes role=teacher)` (hors démo) = **401** comptes. Mes anciens « 261 profs » ne comptaient que les **distributeurs** (col teacher).
- **Entonnoir d'engagement** : 401 engagés → **224 ont enseigné** à leurs propres élèves (≥1 ligne role=student avec teacher=eux) → **177 ont seulement testé** = 37 distributeurs-testeurs + **140 stagiaires** (vus uniquement comme clone-owner d'une formation).
- **Formateur/animateur** = compte qui distribue des clones-test à ≥3 autres comptes-profs (lignes role=teacher, teacher=lui, student≠lui). 12 identifiés ; ils portent ~39 % des lignes de test.
- **Établissement d'un compte** : si enseigné/auto-testé → `uai_teach` modal (son établissement) ; si stagiaire seul → `uai_el` modal de ses clones de formation.
- **Hub fondateur** : `cfcd2084` (id « 0 ») = 404 élèves répartis sur **14 établissements** (56 à Haubourdin) ; à traiter comme compte-maître du réseau pilote, pas comme un prof local.

## Caveats interprétatifs
- « Test » = clone `role=teacher` capturé. Un prof peut s'approprier une activité sans cloner (donc « enseigné sans test » sur-estime peut-être l'adoption directe).
- L'année scolaire se termine à la **mi-juin** (en 2024-2025, plus aucune séance après le 12 juin) : l'extraction du 19 juin couvre 2025-2026 **quasi intégralement** ; les comparaisons inter-années sont justes. Seul angle mort : le retour éventuel en N+1, mesurable l'an prochain.
- Identifiants pseudonymisés = sensibles ; ne jamais tenter de ré-identifier.
