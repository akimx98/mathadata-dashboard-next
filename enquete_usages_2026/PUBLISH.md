# Publication des dashboards — process & registre

Ces dashboards sont diffusés à **deux endroits** : **GitHub Pages** (lien public partageable)
et des **artifacts claude.ai** (partagés avec l'équipe). Pour qu'ils ne **divergent jamais**,
une seule règle :

> **Source de vérité = les fichiers HTML du repo.**
> On n'édite **jamais** une copie publiée (ni gh-pages, ni un artifact) directement.
> On édite la source, puis on **régénère** les deux sorties.

## Registre des pages

| Page | Analyse | Fichier source (repo) | Artifact claude.ai (équipe) | GitHub Pages |
|---|---|---|---|---|
| Accueil | portail | `enquete_usages_2026/pages/index.html` | — | [/](https://akimx98.github.io/mathadata-dashboard-next/) |
| **Synthèse** | Capstone transversal (à lire en premier) | `enquete_usages_2026/transverse/dashboard_synthese.html` | — | [/synthese.html](https://akimx98.github.io/mathadata-dashboard-next/synthese.html) |
| **Typologie** | Cinq façons d'enseigner (profils, rétention) | `enquete_usages_2026/transverse/dashboard_typologie.html` | `0b79ed9b-8e7e-4ecf-b7dc-f4f3aa86ea83` | [/typologie.html](https://akimx98.github.io/mathadata-dashboard-next/typologie.html) |
| **Séances** | Anatomie d'une séance (scénarios, rythmes, cas) | `enquete_usages_2026/transverse/dashboard_seances.html` | — | [/seances.html](https://akimx98.github.io/mathadata-dashboard-next/seances.html) |
| **Volet 1** | Déploiement réel en classe (Capytale) | `enquete_usages_2026/usage-capytale/dashboard.html` | `f4a6cd35-dc33-46fd-bd08-e121a0d1d517` | [/volet1.html](https://akimx98.github.io/mathadata-dashboard-next/volet1.html) |
| **Volet 2** | Du site à la classe (mathadata.fr × Capytale) | `enquete_usages_2026/site-vers-classe/dashboard_volet2.html` | `79e26dd8-eaf0-422b-86e3-5dd69ba6afa8` | [/volet2.html](https://akimx98.github.io/mathadata-dashboard-next/volet2.html) |
| **Flux** | Canal d'arrivée → réutilisation → retour (Sankey) | `enquete_usages_2026/transverse/dashboard_flux_profs.html` | `8ef1d8f4-4dd0-44a1-ae7c-46102b697606` | [/flux.html](https://akimx98.github.io/mathadata-dashboard-next/flux.html) |

Liens artifact = `https://claude.ai/code/artifact/<UUID>`.

## Checklist à chaque modification d'un dashboard

1. **Éditer uniquement le fichier source** (colonne « Fichier source » ci-dessus).
2. **GitHub Pages** : lancer
   ```bash
   bash enquete_usages_2026/publish_pages.sh
   ```
   (copie les 4 fichiers vers la branche `gh-pages`, commit + push, sans `--force`).
3. **Artifact claude.ai** (si la page en a un) : republier **sur le même UUID**.
   - via Claude Code : outil `Artifact` avec `url=https://claude.ai/code/artifact/<UUID>` et le fichier source ;
   - ou sur claude.ai : ouvrir l'artifact → « Update »/nouvelle version.
   L'accueil, la **Synthèse** et les **Séances** n'ont **pas** d'artifact → rien à faire ; Volet 1, Volet 2 et **Typologie** en ont un (UUID ci-dessus).
4. **Committer la source** sur `main` (`git add -A && git commit && git push`).

## Notes

- GitHub Pages est servi depuis la branche **`gh-pages`** (racine), HTTPS forcé.
  Cette branche ne contient **que** les fichiers publiés + `.nojekyll` — elle est
  entièrement régénérée par le script, ne pas l'éditer.
- Avant publication, le script **refuse** de pousser si un email (hors `mathadata.fr`)
  apparaît dans une source (garde-fou anti-fuite de données personnelles).
- Pour ajouter une nouvelle page : ajouter le fichier source, une ligne dans le
  tableau `MAP` de `publish_pages.sh`, une carte dans `pages/index.html`, et une
  ligne dans ce registre.
