#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Publie les dashboards de l'enquête usages sur GitHub Pages (branche gh-pages).
#
# SOURCE DE VÉRITÉ = les fichiers HTML du repo (ci-dessous). On ne touche
# JAMAIS gh-pages à la main : on édite la source, puis on lance ce script.
#
#   Usage :  bash enquete_usages_2026/publish_pages.sh
#
# Voir enquete_usages_2026/PUBLISH.md pour le process complet (+ artifacts claude.ai).
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"   # enquete_usages_2026/
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"                          # racine du repo
E="$SCRIPT_DIR"

# fichier source -> nom publié sur gh-pages
declare -a MAP=(
  "$E/pages/index.html:index.html"
  "$E/volet1/dashboard.html:volet1.html"
  "$E/volet2/dashboard_volet2.html:volet2.html"
  "$E/commons/dashboard_typologie.html:typologie.html"
  "$E/commons/dashboard_seances.html:seances.html"
  "$E/commons/dashboard_synthese.html:synthese.html"
  "$E/commons/dashboard_flux_profs.html:flux.html"
)

# garde-fou sécurité : refuser de publier si un email apparaît dans une source
echo "→ Vérification PII (emails) dans les sources…"
for pair in "${MAP[@]}"; do
  src="${pair%%:*}"
  if grep -hoE '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}' "$src" | grep -qv 'mathadata\.fr'; then
    echo "ABORT : un email non-mathadata.fr a été trouvé dans $src" >&2
    exit 1
  fi
done
echo "  OK, aucun email."

WT="$(mktemp -d)"
cleanup(){ git -C "$ROOT" worktree remove "$WT" --force 2>/dev/null || true; }
trap cleanup EXIT

git -C "$ROOT" fetch origin gh-pages --quiet
git -C "$ROOT" worktree add -f "$WT" gh-pages --quiet
git -C "$WT" merge --ff-only origin/gh-pages --quiet 2>/dev/null || true

for pair in "${MAP[@]}"; do
  src="${pair%%:*}"; dst="${pair##*:}"
  cp "$src" "$WT/$dst"
done
touch "$WT/.nojekyll"
# empêche Vercel de déployer cette branche statique (pas d'app Next.js dessus)
printf '%s\n' '{ "git": { "deploymentEnabled": false } }' > "$WT/vercel.json"

git -C "$WT" add -A
if git -C "$WT" diff --cached --quiet; then
  echo "✓ gh-pages déjà à jour, rien à publier."
else
  git -C "$WT" commit -q -m "Publish: sync dashboards depuis la source ($(git -C "$ROOT" rev-parse --short HEAD))"
  git -C "$WT" push -q origin gh-pages
  echo "✓ Publié → https://akimx98.github.io/mathadata-dashboard-next/"
fi
