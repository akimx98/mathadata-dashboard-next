# Enquête usages MathAData — juin 2026

Enquête approfondie sur le déploiement et les usages réels de MathAData, à partir des données Capytale (extraction du 19 juin 2026, 7 353 affectations).

## Livrables

| Fichier | Contenu |
|---|---|
| **[RAPPORT_ENQUETE_USAGES.md](RAPPORT_ENQUETE_USAGES.md)** | **Rapport textuel complet** — 12 sections argumentées, tableaux, pourcentages, recommandations. |
| **dashboard.html** | Tableau de bord visuel (publié comme Artifact claude.ai, graphiques SVG). |
| `charts/` | 14 graphiques PNG (croissance, comportement, conversion, géo, IPS…). |
| [DEFINITIONS.md](DEFINITIONS.md) | Définitions canoniques et règles métier (cohérence des calculs). |
| `data/facts.json` | Tous les chiffres calculés (source de vérité). |
| `data/{usages_enriched,teachers,establishments,sessions}.csv` | Tables canoniques enrichies. |
| `workflow_deepdives.js` | Script du workflow multi-agents (vérification des KPI + 5 analyses approfondies) — pour rejouer l'analyse sur des données fraîches. |

## Pipeline reproductible

```bash
# 1) données fraîches (déjà dans public/data/capytale_fresh_20260619.csv)
# 2) construction des tables canoniques
python3 build_canonical.py
# 3) calcul de tous les faits -> data/facts.json
python3 compute_facts.py
# 4) graphiques -> charts/
python3 make_charts.py
```

## Principaux enseignements

1. **Outil de lycée, public, de 2nde** (97 % lycée, 98 % public ; 7 profs de collège seulement).
2. **Adoption directe et solitaire** : ⅔ des profs enseignent sans test enregistré ; 80 % des établissements n'ont qu'un prof.
3. **Croissance extensive** : +105 % d'usages élèves en un an, portée à 74 % par des profs nouveaux ; rétention inter-annuelle 30 %.
4. **Moteur de contenu** : statistiques (+1 340) et géométrie (+1 236) ; l'« Intro à l'IA » historique recule (−485).
5. **Trajectoire géographique** : du foyer nordiste (Lille 30 % en 2024-25) à la nation (24 académies, Lille diluée à 20 %).

## Notes méthodologiques

- KPI vérifiés par 3 recomputations indépendantes (cf. §11 du rapport).
- Compte `c81e728d…` (MD5 « 2 ») = 195 lignes rôle-vide d'un compte de démo → **exclu** partout.
- Compte `cfcd2084…` (MD5 « 0 ») = compte pionnier historique (Haubourdin/Lille, 404 élèves, 2023-2026) → conservé mais signalé.
- 2025-2026 incomplète au 19 juin : la croissance affichée est un plancher.
