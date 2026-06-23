# AGENTS.md

Ce dépôt utilise **[`CLAUDE.md`](CLAUDE.md)** comme guide unique pour les agents/LLM.
Lis-le en entier avant toute tâche.

Pour l'analyse de données MathAData (`enquete_usages_2026/`), l'ordre est :
1. **`enquete_usages_2026/transverse/GLOSSAIRE.md`** — source de vérité des définitions (ne jamais redéfinir un terme localement).
2. **`CLAUDE.md` §10-11** — comment répondre à une question d'analyse + carte des données (où trouver quoi).
3. **`enquete_usages_2026/transverse/build_profiles.py`** — la seule couche où naissent les variables « profil ».

Règles d'or : ne pas faire diverger la base (un terme = une définition canonique) ; lire les
`facts_*.json` plutôt que recalculer ; aucune donnée personnelle (nom/prénom/e-mail) dans le repo
ni dans les pages publiées ; publier via `enquete_usages_2026/publish_pages.sh` (jamais éditer une
copie publiée à la main).
