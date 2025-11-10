#!/usr/bin/env python3
import json
import subprocess
import sys
from typing import Dict
from unicodedata import normalize

def normalize_academy_name(name: str) -> str:
    """
    Normalise le nom d'académie de façon cohérente :
    - Convertit en title case
    - Garde les accents
    - Gère les cas spéciaux (Normandie, DOM-TOM)
    """
    # Normaliser les caractères Unicode (NFD -> NFC pour garder les accents composés)
    name = normalize('NFC', name)
    
    # Supprimer le préfixe "Académie de/d'/des/du"
    name = name.strip()
    prefixes = ["Académie d'", "Académie de ", "Académie des ", "Académie du "]
    for prefix in prefixes:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    
    # Convertir en title case (première lettre de chaque mot en majuscule)
    name = name.title()
    
    # Corriger les cas particuliers
    replacements = {
        "D'": "d'",
        "-De-": "-de-",
        " De ": " de ",
        " D' ": " d'",
        " Et ": " et ",
        "Creteil": "Créteil",
        "Clermont-Ferrand": "Clermont-Ferrand",
        "Aix-Marseille": "Aix-Marseille",
    }
    for old, new in replacements.items():
        name = name.replace(old, new)
    
    # Cas spéciaux DOM-TOM
    if name.lower() == "la reunion" or name.lower() == "la réunion":
        return "La Réunion"
    elif name.lower() == "la guadeloupe":
        return "Guadeloupe"
    elif name.lower() == "la martinique":
        return "Martinique"
    
    # Fusion Normandie
    if name in ["Caen", "Rouen"]:
        return "Normandie"
    
    return name

def call_api(dataset: str, query: str) -> list:
    """Appelle l'API via curl et retourne les résultats JSON"""
    url = f"https://data.education.gouv.fr/api/v2/catalog/datasets/{dataset}/records"
    
    cmd = [
        'curl', '-s', '-G', url,
        '--data-urlencode', f'select=count(*) as count, libelle_academie',
        '--data-urlencode', f'where={query}',
        '--data-urlencode', 'group_by=libelle_academie',
        '--data-urlencode', 'limit=100'
    ]
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"❌ Erreur curl: {result.stderr}", file=sys.stderr)
        return []
    
    try:
        data = json.loads(result.stdout)
        return data.get('records', [])
    except json.JSONDecodeError as e:
        print(f"❌ Erreur JSON: {e}", file=sys.stderr)
        return []

def main():
    stats = {}
    
    print("🔄 Génération des statistiques académiques corrigées...")
    print()
    
    # 1. Établissements
    print("1️⃣  Comptage des établissements...")
    
    # Collèges
    print("   Collèges...", end=" ", flush=True)
    records = call_api(
        'fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre',
        'nature_uai_libe="COLLEGE"'
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('libelle_academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_colleges'] = rec['record']['fields']['count']
    print(f"✓ {len(records)} académies")
    
    # Lycées GT
    print("   Lycées GT...", end=" ", flush=True)
    records = call_api(
        'fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre',
        'nature_uai_libe="LYCEE ENSEIGNT GENERAL ET TECHNOLOGIQUE"'
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('libelle_academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_lycees_gt'] = rec['record']['fields']['count']
    print(f"✓ {len(records)} académies")
    
    # Lycées Pro
    print("   Lycées Pro...", end=" ", flush=True)
    records = call_api(
        'fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre',
        'nature_uai_libe="LYCEE PROFESSIONNEL"'
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('libelle_academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_lycees_pro'] = rec['record']['fields']['count']
    print(f"✓ {len(records)} académies")
    print()
    
    # 2. Élèves lycées GT
    print("2️⃣  Comptage des élèves lycées GT (2024-2025)...")
    records = call_api(
        'fr-en-lycee_gt-effectifs-niveau-sexe-lv',
        'rentree_scolaire="2024"'
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('libelle_academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_eleves_lycees_gt'] = rec['record']['fields']['count']
    print(f"   ✓ {len(records)} académies")
    print()
    
    # 3. Élèves lycées Pro
    print("3️⃣  Comptage des élèves lycées Pro (2024-2025)...")
    records = call_api(
        'fr-en-lycee_pro-effectifs-niveau-sexe-lv',
        "rentree_scolaire=date'2024-01-01'"
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('libelle_academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_eleves_lycees_pro'] = rec['record']['fields']['count']
    print(f"   ✓ {len(records)} académies")
    print()
    
    # 4. Compléter avec des 0 pour les valeurs manquantes
    for academy in stats:
        stats[academy].setdefault('nb_colleges', 0)
        stats[academy].setdefault('nb_lycees_gt', 0)
        stats[academy].setdefault('nb_lycees_pro', 0)
        stats[academy].setdefault('nb_eleves_lycees_gt', 0)
        stats[academy].setdefault('nb_eleves_lycees_pro', 0)
    
    # 5. Sauvegarder
    output_file = 'public/data/academies_stats.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Fichier généré: {output_file}")
    print(f"📊 Total: {len(stats)} académies")
    print()
    
    # Exemples
    print("📋 Exemples:")
    for academy in ['Paris', 'Normandie', 'La Réunion', 'Aix-Marseille']:
        if academy in stats:
            s = stats[academy]
            print(f"\n   {academy}:")
            print(f"      - Collèges: {s['nb_colleges']:,}")
            print(f"      - Lycées GT: {s['nb_lycees_gt']:,}")
            print(f"      - Lycées Pro: {s['nb_lycees_pro']:,}")
            print(f"      - Élèves GT: {s['nb_eleves_lycees_gt']:,}")
            print(f"      - Élèves Pro: {s['nb_eleves_lycees_pro']:,}")

if __name__ == '__main__':
    main()
