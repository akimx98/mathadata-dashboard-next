"""Socle partagé de l'enquête usages — SOURCE UNIQUE des constantes & fonctions canoniques.

Tous les scripts du pipeline importent ce module pour ne PLUS dupliquer la logique
(exclusions, seuils, année scolaire, sanitisation JSON). Une définition change ICI, une seule fois.
C'est la réponse structurelle aux bugs « oublié d'exclure le hub dans le script N » et
« NaN accepté par json.load ».

Import type (les scripts ont déjà un bootstrap `_ENQ = dirname(dirname(__file__))`) :
    import sys; sys.path.insert(0, _ENQ); import enquete_common as K
    DEMO, PIO = K.DEMO, K.PIO
"""
import os, math

# ───────── chemins (dérivés de l'emplacement de CE fichier — jamais de /Users/... en dur) ─────────
HERE = os.path.dirname(os.path.abspath(__file__))     # enquete_usages_2026/
ROOT = os.path.dirname(HERE)                            # racine du repo
WS   = os.path.dirname(ROOT)                            # parent (contient mathadata-website/)
PUBLIC = os.path.join(ROOT, "public", "data")
V1 = os.path.join(HERE, "usage-capytale", "data")
V2 = os.path.join(HERE, "site-vers-classe", "data")
TR = os.path.join(HERE, "transverse", "data")
LOCAL = os.environ.get("MATHADATA_LOCAL", os.path.join(HERE, "_local"))   # tables de travail PII-adjacentes (gitignore)
def snapshot():
    """Dossier du snapshot Payload (local, PII). Override : env MATHADATA_SNAPSHOT."""
    return os.environ.get("MATHADATA_SNAPSHOT",
        os.path.join(WS, "mathadata-website", "private", "payload-snapshots", "2026-06-20T10-37-24-905Z"))

# ───────── comptes spéciaux (GLOSSAIRE §2) ─────────
DEMO = 'c81e728d9d4c2f636f067f89cc14862c'   # compte démo (MD5 "2") → EXCLURE de tout
PIO  = 'cfcd208495d565ef66e7dff9f98764da'   # hub fondateur (MD5 "0") → ISOLER (jamais un prof local)
EXCLUDE = (DEMO, PIO)

# ───────── seuils canoniques (GLOSSAIRE §3) ─────────
CLASSE_MIN        = 5     # usage-classe = séance ≥ 5 él.
SEANCE_RICHE_MIN  = 10    # séance riche / « classe entière » = ≥ 10 él. (mode-cible qualité, ≠ seuil)
GRANDE_CLASSE_MIN = 20    # grande classe (paradoxe du déployeur)
DEMI_LO, DEMI_HI, DEMI_DAYS = 5, 15, 10   # demi-groupes : même activité, 5-15 él., < 10 j → 1 occasion
LAST_OBSERVED_SY  = '2025-2026'           # année d'extraction → 1ʳᵉ classe ici = censuré

# ───────── populations nommées (valeurs attendues — ancrent les contrats, GLOSSAIRE §4) ─────────
# POP_CAPYTALE = escalier 2-5 (testeurs + profs ayant touché des élèves) ; voir check_contracts.
EXPECT = dict(POP_CAPYTALE=260, POP_TOUCHED=223, POP_CLASSE=176,
              SOUS_SEUIL=47, TESTEURS=37, COHORT_ELIGIBLE=77)

# ───────── fonctions canoniques ─────────
def school_year(d):
    """date (tz-aware) → 'YYYY-YYYY' (année scolaire 1er sept → 31 août). NA si date manquante."""
    import pandas as pd
    if d is None or (hasattr(pd, 'isna') and pd.isna(d)): return 'NA'
    y = d.year if d.month >= 8 else d.year - 1
    return f"{y}-{y+1}"

def exclude_special(df, col='teacher'):
    """Retire démo + hub fondateur d'un DataFrame (exclusion canonique unique)."""
    return df[~df[col].isin(EXCLUDE)].copy()

def sanitize_json(o):
    """NaN/Inf → None, récursivement → JSON STRICT (json.dump écrirait sinon `NaN`, invalide)."""
    if isinstance(o, float) and (math.isnan(o) or math.isinf(o)): return None
    if isinstance(o, dict): return {k: sanitize_json(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)): return [sanitize_json(v) for v in o]
    return o

def dump_json(obj, path):
    """Écrit du JSON strict (sanitisé, allow_nan=False) — à utiliser partout au lieu de json.dump brut."""
    import json
    json.dump(sanitize_json(obj), open(path, 'w'), ensure_ascii=False, indent=1, allow_nan=False)
