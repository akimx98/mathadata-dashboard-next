#!/usr/bin/env python3
import json
import subprocess
import sys
from unicodedata import normalize as unicode_normalize

def remove_accents(text: str) -> str:
    """Enlève les accents d'une chaîne pour comparaison"""
    # NFD sépare les caractères de base et les accents
    text = unicode_normalize('NFD', text)
    # Garde uniquement les caractères ASCII
    return ''.join(c for c in text if ord(c) < 128)

def normalize_academy_name(name: str) -> str:
    """Normalise le nom d'académie de façon cohérente"""
    name = unicode_normalize('NFC', name)
    
    # Supprimer le préfixe "Académie de/d'/des/du"
    name = name.strip()
    prefixes = ["Académie d'", "Académie de ", "Académie des ", "Académie du "]
    for prefix in prefixes:
        if name.startswith(prefix):
            name = name[len(prefix):]
            break
    
    # Convertir en title case
    name = name.title()
    
    # Corrections pour une version sans accent (pour comparaison)
    name_no_accent = remove_accents(name).lower()
    
    # Map des noms canoniques avec accents corrects
    canonical_names = {
        "aix-marseille": "Aix-Marseille",
        "amiens": "Amiens",
        "besancon": "Besançon",
        "bordeaux": "Bordeaux",
        "caen": "Normandie",  # Fusion
        "rouen": "Normandie",  # Fusion
        "clermont-ferrand": "Clermont-Ferrand",
        "corse": "Corse",
        "creteil": "Créteil",
        "dijon": "Dijon",
        "grenoble": "Grenoble",
        "la guadeloupe": "Guadeloupe",  # Sans "La"
        "guadeloupe": "Guadeloupe",
        "guyane": "Guyane",
        "la reunion": "La Réunion",  # Avec "La"
        "lille": "Lille",
        "limoges": "Limoges",
        "lyon": "Lyon",
        "la martinique": "Martinique",  # Sans "La"
        "martinique": "Martinique",
        "mayotte": "Mayotte",
        "montpellier": "Montpellier",
        "nancy-metz": "Nancy-Metz",
        "nantes": "Nantes",
        "nice": "Nice",
        "orleans-tours": "Orléans-Tours",
        "paris": "Paris",
        "poitiers": "Poitiers",
        "polynesie francaise": "Polynésie Française",
        "reims": "Reims",
        "rennes": "Rennes",
        "strasbourg": "Strasbourg",
        "toulouse": "Toulouse",
        "versailles": "Versailles",
        "nouvelle caledonie": "Nouvelle-Calédonie",
        "wallis et futuna": "Wallis-et-Futuna",
        "st pierre et miquelon": "Saint-Pierre-et-Miquelon",
        "saint pierre et miquelon": "Saint-Pierre-et-Miquelon",
    }
    
    return canonical_names.get(name_no_accent, name)

def call_api(dataset: str, select: str, where: str, group_by: str = 'libelle_academie') -> list:
    """Appelle l'API via curl"""
    url = f"https://data.education.gouv.fr/api/v2/catalog/datasets/{dataset}/records"
    
    cmd = [
        'curl', '-s', '-G', url,
        '--data-urlencode', f'select={select}',
        '--data-urlencode', f'where={where}',
        '--data-urlencode', f'group_by={group_by}',
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
    
    print("🔄 Génération des statistiques académiques...")
    print()
    
    # 1. Établissements
    print("1️⃣  Comptage des établissements...")
    
    for etab_type, nature, key in [
        ("Collèges", "COLLEGE", "nb_colleges"),
        ("Lycées GT", "LYCEE ENSEIGNT GENERAL ET TECHNOLOGIQUE", "nb_lycees_gt"),
        ("Lycées Pro", "LYCEE PROFESSIONNEL", "nb_lycees_pro")
    ]:
        print(f"   {etab_type}...", end=" ", flush=True)
        records = call_api(
            'fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre',
            'count(*) as count, libelle_academie',
            f'nature_uai_libe="{nature}"'
        )
        for rec in records:
            academy = normalize_academy_name(rec['record']['fields'].get('libelle_academie', ''))
            if academy not in stats:
                stats[academy] = {}
            stats[academy][key] = rec['record']['fields']['count']
        print(f"✓ {len(records)} académies")
    print()
    
    # 2. Élèves lycées GT (somme du nombre_d_eleves)
    print("2️⃣  Comptage des élèves lycées GT (2024-2025)...")
    records = call_api(
        'fr-en-lycee_gt-effectifs-niveau-sexe-lv',
        'sum(nombre_d_eleves) as total_eleves, academie',
        'rentree_scolaire="2024"',
        'academie'
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_eleves_lycees_gt'] = rec['record']['fields']['total_eleves']
    print(f"   ✓ {len(records)} académies")
    print()
    
    # 3. Élèves lycées Pro (somme du nombre_d_eleves)
    print("3️⃣  Comptage des élèves lycées Pro (2024-2025)...")
    records = call_api(
        'fr-en-lycee_pro-effectifs-niveau-sexe-lv',
        'sum(nombre_d_eleves) as total_eleves, academie',
        "rentree_scolaire=date'2024-01-01'",
        'academie'
    )
    for rec in records:
        academy = normalize_academy_name(rec['record']['fields'].get('academie', ''))
        if academy not in stats:
            stats[academy] = {}
        stats[academy]['nb_eleves_lycees_pro'] = rec['record']['fields']['total_eleves']
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
            print(f"      - Élèves lycées GT: {s['nb_eleves_lycees_gt']:,}")
            print(f"      - Élèves lycées Pro: {s['nb_eleves_lycees_pro']:,}")

if __name__ == '__main__':
    main()
