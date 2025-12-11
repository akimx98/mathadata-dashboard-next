#!/usr/bin/env python3
import csv
from collections import defaultdict

# Lire l'annuaire pour avoir les infos des établissements
print("📖 Lecture de l'annuaire des établissements...")
etablissements = {}
with open('public/data/annuaire_etablissements.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        uai = row['uai'].strip()
        etablissements[uai] = {
            'nom': row['nom'],
            'nature': row['type_etablissement'],
            'academie': row['academie'],
            'commune': row['commune']
        }

print(f"   ✓ {len(etablissements):,} établissements chargés")
print()

# Lire les usages MathAData
print("📊 Lecture des usages MathAData...")
lycees_idf = defaultdict(lambda: {'nom': '', 'uai': '', 'academie': '', 'commune': '', 'profs': set(), 'total_usages': 0})

academies_idf = ['Créteil', 'Paris', 'Versailles']

with open('public/data/mathadata_2025-10-08.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        # Récupérer l'UAI (peut être dans uai ou uai_el)
        uai = (row.get('uai_el') or row.get('uai') or '').strip()
        if not uai:
            continue
        
        # Vérifier si c'est un établissement connu
        if uai not in etablissements:
            continue
        
        etab = etablissements[uai]
        
        # Vérifier si c'est un lycée d'Île-de-France
        if etab['academie'] not in academies_idf:
            continue
        
        # Vérifier si c'est un lycée
        if etab['nature'].lower() != 'lycee':
            continue
        
        # Compter les profs
        prof = row.get('teacher', '').strip()
        if prof:
            lycees_idf[uai]['profs'].add(prof)
        
        # Stocker les infos de l'établissement
        if not lycees_idf[uai]['nom']:
            lycees_idf[uai]['nom'] = etab['nom']
            lycees_idf[uai]['uai'] = uai
            lycees_idf[uai]['academie'] = etab['academie']
            lycees_idf[uai]['commune'] = etab['commune']
        
        lycees_idf[uai]['total_usages'] += 1

print(f"   ✓ {len(lycees_idf)} lycées d'Île-de-France avec au moins 1 usage")
print()

# Générer le CSV
output_file = 'lycees_idf_mathadata.csv'
print(f"💾 Génération du fichier {output_file}...")

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(['Nom officiel', 'UAI', 'Académie', 'Commune', 'Nombre de profs', 'Total usages'])
    
    # Trier par académie puis par nombre de profs décroissant
    lycees_tries = sorted(
        lycees_idf.items(),
        key=lambda x: (x[1]['academie'], -len(x[1]['profs']), x[1]['nom'])
    )
    
    for uai, data in lycees_tries:
        writer.writerow([
            data['nom'],
            data['uai'],
            data['academie'],
            data['commune'],
            len(data['profs']),
            data['total_usages']
        ])

print(f"   ✓ Fichier généré avec {len(lycees_idf)} lycées")
print()

# Statistiques par académie
print("📈 Statistiques par académie:")
stats = defaultdict(lambda: {'lycees': 0, 'profs_total': 0, 'usages_total': 0})
for uai, data in lycees_idf.items():
    acad = data['academie']
    stats[acad]['lycees'] += 1
    stats[acad]['profs_total'] += len(data['profs'])
    stats[acad]['usages_total'] += data['total_usages']

for acad in ['Créteil', 'Paris', 'Versailles']:
    s = stats[acad]
    print(f"\n   {acad}:")
    print(f"      - {s['lycees']} lycées")
    print(f"      - {s['profs_total']} profs distincts")
    print(f"      - {s['usages_total']:,} usages")

print(f"\n✅ Fichier exporté : {output_file}")
