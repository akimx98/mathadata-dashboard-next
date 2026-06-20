# Volet 2 — Du site à la classe (mathadata.fr × Capytale)

Croisement du parcours amont **nominatif** (mathadata.fr, snapshot Payload) avec l'usage en classe **anonyme** (Capytale, Volet 1). Reconstitue le pipeline enseignant complet et mesure l'effet des formations (présentiel vs webinaire).

## Livrables
- **`RAPPORT_VOLET2.md`** — rapport argumenté (résumé exécutif, 8 sections, insights transverses, recommandations, limites).
- **`dashboard_volet2.html`** — page web compagnon (artefact publié). Auto-portante, graphiques SVG inline.
- **`DEFINITIONS_VOLET2.md`** — définitions canoniques, le pont de données, garde-fous.

## Pipeline (reproductible)
1. `build_payload_canonical.py` — couche site depuis le snapshot Payload (PII → scratchpad ; agrégats → `data/`).
2. `compute_cross_facts.py` — **`data/facts_cross.json`** (source de vérité) + tables par UAI.
3. `match_individuals.py` — appariement individuel inféré → `data/match_candidates.csv` (pseudonymisé) + `match_validation.json`.
4. `make_charts_volet2.py` — graphiques PNG (`charts/`).
5. `workflow_volet2.js` — orchestration multi-agents : 8 deep-dives → vérification adversariale → synthèse (sorties dans `data/SEC_*.md`, `sections_final.json`, `synthese_final.md`).

## Le pont de données
`consultation_rss.file == "capytale2.ac-paris.fr/web/b/<id>"` ⟹ `<id> == mathadata_id` Capytale. Seul lien direct (clic nominatif → activité Capytale, daté). S'arrête au clic ; le clonage ENT reste anonyme.

## Garde-fous
- Tracking clics depuis le **27 nov. 2025** : métriques de clic sous-captées avant → distinguer « toutes dates » vs **cohorte trackable**. La conversion au grain établissement (historique Capytale complet 2023-2026) n'est PAS biaisée.
- Deux types de formation : `presentiel` (en établissement), `webdecouv` (webinaire). Date sentinelle bidon `1984-01-01` = manquante.
- 9 comptes `exclude_from_analytics` + démo Capytale exclus ; hub fondateur Haubourdin isolé.

## Sécurité
Le snapshot Payload (PII) reste **local et gitignore**. Aucune sortie versionnée/publiée ne contient nom/prénom/e-mail. Appariement pseudonymisé (`S####` / md5[:8]). Pas de ré-identification.
