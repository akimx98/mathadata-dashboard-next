# CLAUDE.md — repo mathadata-dashboard-next

Deux choses vivent ici :
1. **L'application** dashboard Next.js (tableau de bord interactif, déployé sur Vercel).
2. **L'enquête usages MathAData** (`enquete_usages_2026/`) — analyses de données d'usage. **C'est
   l'objet de l'essentiel du travail récent.** Tout ce qui suit la concerne.

---

# Enquête usages — playbook d'exploration des données

> **À lire avant toute analyse de données MathAData** (toi, future session, ou collègue).
> Quand on te demande « explore les données / calcule X / fais un graphe », commence ici.

## 1. La règle nº 1 : les définitions sont canoniques et centralisées

**[`enquete_usages_2026/transverse/GLOSSAIRE.md`](enquete_usages_2026/transverse/GLOSSAIRE.md) est la
source de vérité de TOUTES les définitions** (année scolaire, prof, séance, classe, profondeur
d'usage, canal, formation, rétention, niveau…). **Ne JAMAIS** redéfinir un terme localement ni
inventer un seuil. Si un calcul a besoin d'une notion, elle doit déjà être dans le glossaire ; sinon,
**on l'ajoute au glossaire d'abord**, puis on calcule. En cas de divergence entre un rapport et le
glossaire, **le glossaire gagne** (le rapport est à corriger).

Les `DEFINITIONS.md` / `DEFINITIONS_VOLET2.md` ne contiennent que les **spécificités de source**
(chemins, schémas, quirks) et **pointent** vers le glossaire pour le sens.

## 2. La couche de calcul canonique

Les variables dérivées par prof naissent dans **un seul** module :
**[`enquete_usages_2026/transverse/build_profiles.py`](enquete_usages_2026/transverse/build_profiles.py)**
→ produit `transverse/data/profiles_teacher_year.csv` (prof × année), `profiles_teacher.csv` (attributs
figés + rétention), `facts_profiles.json` (agrégats = source de vérité des chiffres du dashboard Flux).
**Toute nouvelle variable « profil » s'ajoute là**, pas dans un script ad hoc du scratchpad.

## 3. Les deux mondes (le piège structurant)

Deux sources **disjointes**, sans clé commune directe :
- **Capytale** (`public/data/capytale_fresh_20260619.csv`) — usage en classe, **anonyme** (MD5).
  Couvre 2023→2026.
- **mathadata.fr / Payload** — parcours amont, **nominatif**, snapshot **local & gitignore** dans
  `../mathadata-website/private/payload-snapshots/2026-06-20T10-37-24-905Z/` (repo voisin). Le
  tracking des clics ne commence que **~27 nov 2025** (avant : clics invisibles → ne pas conclure
  « pas d'intérêt »).

Le pont : un clic site `web/b/<id>` → `<id> == mathadata_id` Capytale. Sinon, **appariement
individuel inféré** (signaux A/B/D/E, 75 paires) + **trace établissement**. Tout ce qui relie les deux
mondes est **estimé**, jamais mesuré — le dire explicitement.

## 4. Pièges à connaître (déjà payés — ne pas refaire)

- **`n_teacher_clones` / `n_teacher_accounts` ≠ nombre de profs.** Ces colonnes ne comptent que les
  auto-tests `role=teacher`. **59 % des profs (133/224) n'en créent jamais** (« plongée directe »).
  Pour compter les profs : `distinct(teacher)` sur les lignes `role=student`.
- **Circularité rétention.** La réutilisation (intensité) est **strictement intra-annuelle**. Compter
  une activité/séance d'une autre année rend « réutiliser ⇒ revenir » tautologique. Le retour se
  mesure **entre** années, séparément. (Cf. l'audit qui a invalidé le « 76 % vs 16 % » carrière.)
- **Hub fondateur** `cfcd2084…` (MD5 "0") : 404 élèves sur 14 établissements → **isoler**, jamais
  un prof local. **Compte démo** `c81e728d…` (MD5 "2") → **exclure**.
- **`ancienne_vague`** (147 formés avant le système de codes du 15/01/26) : type & date **inconnus**,
  ne pas les compter comme webinaire.
- **Récence des cohortes** : lire au présent une cohorte formée en 2026 sous-estime son rendement
  (le déploiement classe se fait au trimestre suivant). Toujours distinguer cohorte mûre / récente.

## 5. Pipeline (ordre de calcul)

```
usage-capytale/build_canonical.py      # Capytale → usages_enriched, sessions, teachers, establishments
site-vers-classe/build_payload_canonical.py  # Payload (LOCAL) → table site id-only (→ scratchpad) + capytale_by_uai
site-vers-classe/match_individuals.py    # appariement site↔Capytale → match_candidates.csv (75 paires, sans PII)
transverse/build_profiles.py      # ★ couche canonique profils (profondeur/canal/formation/rétention)
transverse/build_master.py, build_scenarios.py  # typologie & séances
*/compute_*facts.py, make_charts*.py          # agrégats + PNG
```
Les `data/*.json` (`facts*.json`) sont les **sources de vérité chiffrées** — un dashboard ne
recalcule pas, il **lit** ces faits.

## 6. Publication (ne jamais diverger)

Voir **[`enquete_usages_2026/PUBLISH.md`](enquete_usages_2026/PUBLISH.md)**. Source de vérité = les
fichiers HTML du repo. On régénère **gh-pages** (`bash enquete_usages_2026/publish_pages.sh`) **et**
les **artifacts claude.ai** (même UUID) — jamais l'inverse. Le script **refuse** de publier si un
e-mail non-`mathadata.fr` apparaît dans une source.

## 7. Sécurité (NON NÉGOCIABLE)

- **Aucun** nom / prénom / e-mail dans le repo git **ni** dans les artefacts publiés. Pseudonymes
  `S####` (site) / `md5[:8]` (Capytale), grain établissement/commune.
- Le snapshot Payload reste **local & gitignore**, **jamais committé**. Les fichiers de travail
  nominatifs (ex. `scratchpad/match_nominatif.csv`, docs `private/`) **ne sortent jamais** du local.
- Jamais de ré-identification.

## 8. Git (préférence du mainteneur)

**Pas de PR sur ce repo** : commits directs sur `main`, ou auto-merge en fin de tâche après
relecture. Messages de commit en français, scope `(enquête)`.

## 9. Structure (cadre mental)

Historiquement « volet 1 / volet 2 », mais le bon cadre est : **une synthèse transversale + des
analyses qui répondent à des questions différentes** (mêmes définitions canoniques, mêmes données) —
voir `enquete_usages_2026/README.md`. À lire en premier : `transverse/SYNTHESE_FINALE_2026.md`.
