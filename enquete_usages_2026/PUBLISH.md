# Publication des dashboards — process & registre

Les dashboards de l'enquête sont diffusés à **un seul endroit** : **GitHub Pages**
(branche `gh-pages`, lien public partageable). Une seule règle :

> **Source de vérité = les fichiers HTML du repo.**
> On n'édite **jamais** une copie publiée (gh-pages) directement.
> On édite la source, puis on **régénère** avec `publish_pages.sh`.

> ℹ️ **Les anciens artifacts claude.ai sont retirés (24 juin 2026).** Pour éviter toute
> divergence (deux surfaces à maintenir en parallèle), on ne garde que GitHub Pages. Les 4 UUID
> historiques (Typologie/Volet 1/Volet 2/Flux) ont été remplacés par des **pages de redirection**
> vers GitHub Pages — **ne plus jamais y republier de dashboard**. Pour les supprimer définitivement :
> ouvrir chaque artifact sur claude.ai → *Delete* (cf. liste des UUID en bas).

## Registre des pages

| Page | Analyse | Fichier source (repo) | GitHub Pages |
|---|---|---|---|
| Accueil | portail | `enquete_usages_2026/pages/index.html` | [/](https://akimx98.github.io/mathadata-dashboard-next/) |
| **Synthèse** | Capstone transversal (à lire en premier) | `enquete_usages_2026/transverse/dashboard_synthese.html` | [/synthese.html](https://akimx98.github.io/mathadata-dashboard-next/synthese.html) |
| **Typologie** | Cinq façons d'enseigner (profils, rétention) | `enquete_usages_2026/transverse/dashboard_typologie.html` | [/typologie.html](https://akimx98.github.io/mathadata-dashboard-next/typologie.html) |
| **Séances** | Anatomie d'une séance (scénarios, rythmes, cas) | `enquete_usages_2026/transverse/dashboard_seances.html` | [/seances.html](https://akimx98.github.io/mathadata-dashboard-next/seances.html) |
| **Volet 1** | Déploiement réel en classe (Capytale) | `enquete_usages_2026/usage-capytale/dashboard.html` | [/volet1.html](https://akimx98.github.io/mathadata-dashboard-next/volet1.html) |
| **Volet 2** | Du site à la classe (mathadata.fr × Capytale) | `enquete_usages_2026/site-vers-classe/dashboard_volet2.html` | [/volet2.html](https://akimx98.github.io/mathadata-dashboard-next/volet2.html) |
| **Flux** | Canal d'arrivée → réutilisation → retour (Sankey) | `enquete_usages_2026/transverse/dashboard_flux_profs.html` | [/flux.html](https://akimx98.github.io/mathadata-dashboard-next/flux.html) |

## Checklist à chaque modification d'un dashboard

1. **Éditer uniquement le fichier source** (colonne « Fichier source » ci-dessus). Pour Flux,
   ne pas éditer les chiffres à la main : ils sont **générés** par `build_flux_dashboard.py`
   depuis `facts_profiles.json`.
2. **Committer la source** sur `main` (`git add -A && git commit && git push`).
3. **Publier sur GitHub Pages** :
   ```bash
   bash enquete_usages_2026/publish_pages.sh
   ```
   Copie les 7 fichiers vers la branche `gh-pages`, commit (avec le SHA source dans le message)
   + push, sans `--force`. Idempotent (« déjà à jour, rien à publier » s'il n'y a rien de neuf).

C'est tout : **une seule surface, pas de double publication**.

## Notes

- GitHub Pages est servi depuis la branche **`gh-pages`** (racine), HTTPS forcé. Cette branche ne
  contient **que** les fichiers publiés + `.nojekyll` + `vercel.json` — elle est entièrement
  régénérée par le script, ne pas l'éditer.
- **Pas de dérive possible côté gh-pages** : son contenu vit dans le repo, donc diffable contre la
  source à tout moment (`git show gh-pages:flux.html` vs source). Le script ne pousse que s'il y a
  un diff.
- Avant publication, le script **refuse** de pousser si un email (hors `mathadata.fr`) apparaît dans
  une source (garde-fou anti-fuite de données personnelles).
- Pour ajouter une nouvelle page : ajouter le fichier source, une ligne dans le tableau `MAP` de
  `publish_pages.sh`, une carte dans `pages/index.html`, et une ligne dans ce registre.

## Artifacts claude.ai retirés (UUID historiques)

Remplacés par des pages de redirection le 24 juin 2026. Pour suppression définitive (optionnel),
ouvrir chacun sur claude.ai → *Delete* :

- Typologie : `0b79ed9b-8e7e-4ecf-b7dc-f4f3aa86ea83`
- Volet 1 : `f4a6cd35-dc33-46fd-bd08-e121a0d1d517`
- Volet 2 : `79e26dd8-eaf0-422b-86e3-5dd69ba6afa8`
- Flux : `8ef1d8f4-4dd0-44a1-ae7c-46102b697606`
