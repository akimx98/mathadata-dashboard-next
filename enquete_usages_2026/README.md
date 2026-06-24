# Enquête usages MathAData (juin 2026)

Le bon cadre mental n'est pas « deux volets » mais **une synthèse transversale + des analyses qui
répondent à des questions différentes**, toutes calées sur **les mêmes définitions canoniques** et
les mêmes données. Les dossiers `usage-capytale/` `site-vers-classe/` restent l'organisation **physique** (par source
de données), mais le découpage compte moins que la question traitée.

```
enquete_usages_2026/
├── transverse/  — ★ GLOSSAIRE (définitions canoniques) · couche de calcul profils · synthèse · typologie · séances · flux
├── usage-capytale/   — source Capytale seule (usage en classe, anonyme)
└── site-vers-classe/   — source croisée mathadata.fr (site, nominatif) × Capytale
```

> 📖 **Avant tout calcul, lire [`transverse/GLOSSAIRE.md`](transverse/GLOSSAIRE.md)** — source de vérité
> unique de toutes les définitions. La couche de calcul canonique des profils est
> [`transverse/build_profiles.py`](transverse/build_profiles.py). Playbook complet : `../CLAUDE.md`.

## ★ [Synthèse finale](transverse/SYNTHESE_FINALE_2026.md) — à lire en premier
**Synthèse réflexive transversale** croisant les 4 rapports : que conclure de 3 ans d'usage (Capytale × site) sur l'adoption, les profils, l'effet des formations, les dynamiques et les modes d'usage — et **comment déployer mieux en 2026-2027** (plus de profs *et* meilleur mode d'usage). Thèse : la **notoriété est acquise**, mais la **conversion** reste à gagner, à trois étages (formation→classe, classe→retour, essai→profondeur) ; la croissance est surtout organique, et les **mêmes gestes de la 1ʳᵉ année** (≥2 activités, vraie séance de 45 min) déterminent la durée. → [`transverse/SYNTHESE_FINALE_2026.md`](transverse/SYNTHESE_FINALE_2026.md)

## [Volet 1 — Usage Capytale](usage-capytale/) (`usage-capytale/`)
Que font les profs et les élèves **sur Capytale** (2023→2026) : croissance, comportements (test/enseigne), saisonnalité, géographie, IPS, taille de classe, rétention, modèle des comptes (401 engagés → 224 ont enseigné → 5 854 élèves).
- Rapport : [`usage-capytale/RAPPORT_ENQUETE_USAGES.md`](usage-capytale/RAPPORT_ENQUETE_USAGES.md) · Définitions : [`usage-capytale/DEFINITIONS.md`](usage-capytale/DEFINITIONS.md)
- Page web : `usage-capytale/dashboard.html` → https://claude.ai/code/artifact/f4a6cd35-dc33-46fd-bd08-e121a0d1d517
- Pipeline : `build_canonical.py` → `compute_facts.py` / `build_teachers_v2.py` → `make_charts.py` (+ `workflow_deepdives.js`). Données : `usage-capytale/data/` · Graphiques : `usage-capytale/charts/`.

## [Volet 2 — Du site à la classe](site-vers-classe/) (`site-vers-classe/`)
Reconstitue le **pipeline complet** (notoriété → compte → formation → Capytale → classe) en croisant le parcours amont nominatif (snapshot Payload mathadata.fr) avec l'usage Capytale. Effet des formations (présentiel / webinaire / établissement-ciblée), deux portes, intention vs usage, appariement individuel inféré.
- Rapport : [`site-vers-classe/RAPPORT_VOLET2.md`](site-vers-classe/RAPPORT_VOLET2.md) · Définitions : [`site-vers-classe/DEFINITIONS_VOLET2.md`](site-vers-classe/DEFINITIONS_VOLET2.md) · Index : [`site-vers-classe/README.md`](site-vers-classe/README.md)
- Page web : `site-vers-classe/dashboard_volet2.html` → https://claude.ai/code/artifact/79e26dd8-eaf0-422b-86e3-5dd69ba6afa8
- Pipeline : `build_payload_canonical.py` → `compute_cross_facts.py` → `build_formation_cohorts.py` → `match_individuals.py` → `make_charts_volet2.py` (+ workflows). Source de vérité : `site-vers-classe/data/facts_cross.json` & `facts_formation.json`.

## [Transverse — Typologie des profils](transverse/) (`transverse/`)
Refonte **data-driven et vérifiée** de la sociologie des usages (prolonge et corrige `ANALYSE_PATTERNS_USAGE.md` du 4 nov. 2025). Règles déterministes (5 archétypes, cf. `build_master.py`) sur les 223 profs ayant enseigné (hub fondateur isolé), puis **enquête croisée** (10 questions investiguées par agents + vérification adversariale) répondant à deux questions : *qui atteint la classe ?* et *pourquoi la plupart ne reviennent pas ?* Faits saillants : **paradoxe du déployeur** (atteint une vraie classe, 0/41 reviennent), rétention 34 % (cohorte éligible classe ≥5), prédicteurs « dose année 1 », nuls confirmés (collectif intra-établissement, « effet formation » = artefact de composition).
- Rapport : [`transverse/TYPOLOGIE_PROFILS_2026.md`](transverse/TYPOLOGIE_PROFILS_2026.md)
- Page web (canonique) : `transverse/dashboard_typologie.html` → https://akimx98.github.io/mathadata-dashboard-next/typologie.html · miroir artifact équipe : https://claude.ai/code/artifact/0b79ed9b-8e7e-4ecf-b7dc-f4f3aa86ea83
- Pipeline : `build_master.py` (table maître) → `workflow_typologie.js` (enquête + vérif) → charts. Sources de vérité : `transverse/data/facts_typologie.json`, `facts_investigation.json`, `master_teachers.csv` (pseudonymisé). Graphiques : `transverse/charts/`.

**Séances — Anatomie d'une séance** (pendant « la séance » du précédent « le prof ») : comment l'outil se vit en classe — rythmes horaires, scénarios d'usage (déploiement, soutien récurrent, demi-groupe, reprises, travail-maison), engagement élève, galerie de cas réels. Enquête vérifiée (14 questions).
- Rapport : [`transverse/RAPPORT_SEANCES_2026.md`](transverse/RAPPORT_SEANCES_2026.md)
- Page web (canonique) : `transverse/dashboard_seances.html` → https://akimx98.github.io/mathadata-dashboard-next/seances.html
- Pipeline : `build_scenarios.py` → `workflow_scenarios.js` → charts `sea_*`. Sources : `transverse/data/scenarios_teachers.csv`, `sessions_enriched.csv`, `facts_scenarios.json`.

## Entrées partagées (hors dépôt enquête)
- `public/data/capytale_fresh_20260619.csv` — extraction usage Capytale (versionnée).
- `public/data/annuaire_etablissements.csv` — référentiel établissements (IPS, géo).
- Snapshot Payload `mathadata.fr` (PII) : `mathadata-website/private/payload-snapshots/…` — **gitignore, hors dépôt, jamais committé**. Le Volet 2 le lit en local pour calculer ; aucune sortie versionnée ne contient nom/prénom/e-mail.

## Sécurité
Identifiants pseudonymisés et sensibles. Aucune ré-identification. Les sorties versionnées et les pages publiées ne contiennent aucune donnée personnelle (pseudonymes `S####` / md5, grain établissement/commune).
