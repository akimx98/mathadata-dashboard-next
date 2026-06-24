#!/usr/bin/env python3
"""Récupère l'extraction d'usage Capytale via l'API Capytale et écrit un CSV daté,
prêt à devenir l'entrée de référence de l'enquête (`public/data/capytale_fresh_AAAAMMJJ.csv`).

C'est l'équivalent CLI de la logique embarquée dans l'app Next.js (`app/api/csv/route.ts`,
source de vérité de l'appel API). La donnée renvoyée est déjà **pseudonymisée** (aucune PII).

PRÉREQUIS — le token API :
  - Il se nomme CAPYTALE_MATHADATA_TOKEN et se met dans le fichier `.env.local` à la RACINE du dépôt.
  - Le récupérer dans le **trousseau du Drive MathAData** (keychain partagé) et l'ajouter à son
    `.env.local` :  CAPYTALE_MATHADATA_TOKEN=xxxxxxxx
  - `.env.local` est gitignore : ne JAMAIS committer le token.

USAGE :
  python3 enquete_usages_2026/fetch_capytale.py
  # → écrit public/data/capytale_fresh_<date Paris>.csv (sans écraser un fichier existant)

ENSUITE (promotion en référence) :
  1. Définir MATHADATA_CAPYTALE_CSV sur le nouveau fichier ;
  2. `bash enquete_usages_2026/rebuild_all.sh` puis vérifier les contrats.
"""
import csv, io, os, sys, urllib.request, urllib.error
from datetime import datetime, timezone, timedelta

HERE = os.path.dirname(os.path.abspath(__file__))     # enquete_usages_2026/
ROOT = os.path.dirname(HERE)                            # racine du dépôt
ENV  = os.path.join(ROOT, ".env.local")
OUTDIR = os.path.join(ROOT, "public", "data")

API_URL = os.environ.get("CAPYTALE_MATHADATA_URL",
                         "https://capytale2.ac-paris.fr/web/c-stat/mathadata")

# Schéma canonique de l'enquête (ordre + casse EXACTS du CSV de référence ; `role` en minuscule).
COLUMNS = ["assignment_id", "created", "changed", "assignment_title", "student", "role",
           "uai_el", "activity_id", "teacher", "uai_teach", "mathadata_id", "mathadata_title"]


def load_token():
    """Lit CAPYTALE_MATHADATA_TOKEN depuis l'environnement, sinon depuis .env.local. Jamais affiché."""
    tok = os.environ.get("CAPYTALE_MATHADATA_TOKEN")
    if tok:
        return tok.strip()
    if not os.path.exists(ENV):
        sys.exit(f"✗ Token introuvable. Crée {ENV} avec :\n"
                 f"    CAPYTALE_MATHADATA_TOKEN=...   (à récupérer dans le trousseau du Drive MathAData)")
    for line in open(ENV, encoding="utf-8"):
        line = line.strip()
        if line.startswith("CAPYTALE_MATHADATA_TOKEN="):
            v = line.split("=", 1)[1].strip().strip('"').strip("'")
            if v:
                return v
    sys.exit(f"✗ CAPYTALE_MATHADATA_TOKEN absent ou vide dans {ENV} "
             f"(le récupérer dans le trousseau du Drive MathAData).")


def paris_date():
    """Date du jour en Europe/Paris (UTC+1/+2) au format AAAAMMJJ, sans dépendance externe."""
    # approximation suffisante pour nommer un fichier : UTC+2 l'été, mais on prend l'heure locale système.
    return datetime.now().strftime("%Y%m%d")


def fetch_raw(token):
    req = urllib.request.Request(API_URL, headers={
        "Authorization": f"Bearer {token}",
        "Accept": "text/csv",
    })
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            ctype = (r.headers.get("Content-Type") or "").lower()
            body = r.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        sys.exit(f"✗ Capytale a répondu HTTP {e.code}. (Token périmé/incorrect ? URL : {API_URL})")
    except urllib.error.URLError as e:
        sys.exit(f"✗ Échec réseau vers {API_URL} : {e.reason}")
    if "csv" not in ctype:
        print(f"⚠ Content-Type inattendu ({ctype or 'inconnu'}) — on tente quand même de parser.")
    return body


def normalize(raw):
    """Parse le CSV brut, normalise les en-têtes (trim, `role` en minuscule), NULL→'',
    valide les 12 colonnes, et réécrit dans l'ordre canonique."""
    reader = csv.DictReader(io.StringIO(raw))
    src_fields = [(h or "").strip().strip('"') for h in (reader.fieldnames or [])]
    # map insensible à la casse → nom canonique attendu
    canon = {c.lower(): c for c in COLUMNS}
    rename = {}
    for h in src_fields:
        key = h.lower()
        if key in canon:
            rename[h] = canon[key]
    present = set(rename.values())
    missing = [c for c in COLUMNS if c not in present]
    if missing:
        sys.exit(f"✗ Colonnes manquantes dans la réponse Capytale : {', '.join(missing)}\n"
                 f"  En-têtes reçus : {', '.join(src_fields)}")
    rows = []
    for row in reader:
        out = {}
        for h, v in row.items():
            hc = (h or "").strip().strip('"')
            if hc in rename:
                val = ("" if v is None else str(v)).strip()
                out[rename[hc]] = "" if val == "NULL" else val
        rows.append(out)
    if not rows:
        sys.exit("✗ La réponse Capytale ne contient aucune ligne.")
    return rows


def main():
    token = load_token()
    print(f"→ Appel API Capytale : {API_URL}")
    rows = normalize(fetch_raw(token))
    os.makedirs(OUTDIR, exist_ok=True)
    out = os.path.join(OUTDIR, f"capytale_fresh_{paris_date()}.csv")
    if os.path.exists(out):
        sys.exit(f"✗ {out} existe déjà — renomme/supprime l'ancien ou change de date avant de relancer.")
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUMNS)
        w.writeheader()
        w.writerows(rows)
    print(f"✓ {len(rows)} lignes écrites → {os.path.relpath(out, ROOT)}")
    print("  Aucune PII (donnée pseudonymisée). NE PAS committer le token (.env.local est gitignore).")
    print(f'  Étape suivante : export MATHADATA_CAPYTALE_CSV="$PWD/{os.path.relpath(out, ROOT)}"')
    print("  puis lancer : bash enquete_usages_2026/rebuild_all.sh")
    print("  (détails : enquete_usages_2026/DONNEES_BRUTES_CAPYTALE.md).")


if __name__ == "__main__":
    main()
