# Enquête usages MathAData (juin 2026)

Analyse des usages de MathAData en deux volets. Organisation :

```
enquete_usages_2026/
├── volet1/   — Données Capytale seules (usage en classe, anonyme)
├── volet2/   — Croisement mathadata.fr (site, nominatif) × Capytale
└── commons/  — Analyses transverses aux deux volets
```

## [Volet 1 — Usage Capytale](volet1/) (`volet1/`)
Que font les profs et les élèves **sur Capytale** (2023→2026) : croissance, comportements (test/enseigne), saisonnalité, géographie, IPS, taille de classe, rétention, modèle des comptes (401 engagés → 224 ont enseigné → 5 854 élèves).
- Rapport : [`volet1/RAPPORT_ENQUETE_USAGES.md`](volet1/RAPPORT_ENQUETE_USAGES.md) · Définitions : [`volet1/DEFINITIONS.md`](volet1/DEFINITIONS.md)
- Page web : `volet1/dashboard.html` → https://claude.ai/code/artifact/f4a6cd35-dc33-46fd-bd08-e121a0d1d517
- Pipeline : `build_canonical.py` → `compute_facts.py` / `build_teachers_v2.py` → `make_charts.py` (+ `workflow_deepdives.js`). Données : `volet1/data/` · Graphiques : `volet1/charts/`.

## [Volet 2 — Du site à la classe](volet2/) (`volet2/`)
Reconstitue le **pipeline complet** (notoriété → compte → formation → Capytale → classe) en croisant le parcours amont nominatif (snapshot Payload mathadata.fr) avec l'usage Capytale. Effet des formations (présentiel / webinaire / établissement-ciblée), deux portes, intention vs usage, appariement individuel inféré.
- Rapport : [`volet2/RAPPORT_VOLET2.md`](volet2/RAPPORT_VOLET2.md) · Définitions : [`volet2/DEFINITIONS_VOLET2.md`](volet2/DEFINITIONS_VOLET2.md) · Index : [`volet2/README.md`](volet2/README.md)
- Page web : `volet2/dashboard_volet2.html` → https://claude.ai/code/artifact/79e26dd8-eaf0-422b-86e3-5dd69ba6afa8
- Pipeline : `build_payload_canonical.py` → `compute_cross_facts.py` → `build_formation_cohorts.py` → `match_individuals.py` → `make_charts_volet2.py` (+ workflows). Source de vérité : `volet2/data/facts_cross.json` & `facts_formation.json`.

## [Commons — Typologie des profils](commons/) (`commons/`)
Refonte **data-driven et vérifiée** de la sociologie des usages (prolonge et corrige `ANALYSE_PATTERNS_USAGE.md` du 4 nov. 2025). Clustering k-means (k=5) des 224 profs ayant enseigné → 5 archétypes, puis **enquête croisée** (10 questions investiguées par agents + vérification adversariale) répondant à deux questions : *qui atteint la classe ?* et *pourquoi la plupart ne reviennent pas ?* Faits saillants : **paradoxe du déployeur** (atteint une vraie classe, 0/41 reviennent), rétention 31 % sur cohorte éligible, prédicteurs « dose année 1 », nuls confirmés (collectif intra-établissement, « effet formation » = artefact de composition).
- Rapport : [`commons/TYPOLOGIE_PROFILS_2026.md`](commons/TYPOLOGIE_PROFILS_2026.md)
- Page web (canonique) : `commons/dashboard_typologie.html` → https://akimx98.github.io/mathadata-dashboard-next/typologie.html · miroir artifact équipe : https://claude.ai/code/artifact/0b79ed9b-8e7e-4ecf-b7dc-f4f3aa86ea83
- Pipeline : `build_master.py` (table maître) → `workflow_typologie.js` (enquête + vérif) → charts. Sources de vérité : `commons/data/facts_typologie.json`, `facts_investigation.json`, `master_teachers.csv` (pseudonymisé). Graphiques : `commons/charts/`.

**Séances — Anatomie d'une séance** (pendant « la séance » du précédent « le prof ») : comment l'outil se vit en classe — rythmes horaires, scénarios d'usage (déploiement, soutien récurrent, demi-groupe, reprises, travail-maison), engagement élève, galerie de cas réels. Enquête vérifiée (14 questions).
- Rapport : [`commons/RAPPORT_SEANCES_2026.md`](commons/RAPPORT_SEANCES_2026.md)
- Page web (canonique) : `commons/dashboard_seances.html` → https://akimx98.github.io/mathadata-dashboard-next/seances.html
- Pipeline : `build_scenarios.py` → `workflow_scenarios.js` → charts `sea_*`. Sources : `commons/data/scenarios_teachers.csv`, `sessions_enriched.csv`, `facts_scenarios.json`.

## Entrées partagées (hors dépôt enquête)
- `public/data/capytale_fresh_20260619.csv` — extraction usage Capytale (versionnée).
- `public/data/annuaire_etablissements.csv` — référentiel établissements (IPS, géo).
- Snapshot Payload `mathadata.fr` (PII) : `mathadata-website/private/payload-snapshots/…` — **gitignore, hors dépôt, jamais committé**. Le Volet 2 le lit en local pour calculer ; aucune sortie versionnée ne contient nom/prénom/e-mail.

## Sécurité
Identifiants pseudonymisés et sensibles. Aucune ré-identification. Les sorties versionnées et les pages publiées ne contiennent aucune donnée personnelle (pseudonymes `S####` / md5, grain établissement/commune).
