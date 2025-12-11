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
            'type': row['type_etablissement'],
            'academie': row['academie'],
            'commune': row['commune']
        }

print(f"   ✓ {len(etablissements):,} établissements chargés")
print()

# Lire les usages MathAData
print("📊 Analyse des usages MathAData...")
etab_stats = defaultdict(lambda: {
    'nom': '',
    'academie': '',
    'commune': '',
    'nb_seances': 0,
    'profs': set(),
    'eleves': set()
})

with open('public/data/mathadata_2025-10-08.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    ligne_num = 0
    for row in reader:
        ligne_num += 1
        
        # Récupérer l'UAI
        uai = (row.get('uai_el') or row.get('uai') or '').strip()
        if not uai:
            continue
        
        # Vérifier si c'est un établissement connu
        if uai not in etablissements:
            continue
        
        etab = etablissements[uai]
        
        # Stocker les infos de l'établissement
        if not etab_stats[uai]['nom']:
            etab_stats[uai]['nom'] = etab['nom']
            etab_stats[uai]['academie'] = etab['academie']
            etab_stats[uai]['commune'] = etab['commune']
        
        # Compter les séances (1 ligne = 1 séance)
        etab_stats[uai]['nb_seances'] += 1
        
        # Compter les profs
        prof = row.get('teacher', '').strip()
        if prof:
            etab_stats[uai]['profs'].add(prof)
        
        # Compter les élèves (si student est rempli, c'est une séance élève)
        eleve = row.get('student', '').strip()
        if eleve:
            etab_stats[uai]['eleves'].add(eleve)

print(f"   ✓ {ligne_num:,} lignes analysées")
print(f"   ✓ {len(etab_stats)} établissements avec au moins 1 usage")
print()

# Trier par nombre de séances (desc), puis nombre d'élèves (desc)
print("🔢 Tri des établissements...")
etab_tries = sorted(
    etab_stats.items(),
    key=lambda x: (-x[1]['nb_seances'], -len(x[1]['eleves']), x[1]['nom'])
)

# Prendre le top 100
top100 = etab_tries[:100]
print(f"   ✓ Top 100 établissements sélectionnés")
print()

# Générer le CSV
output_file = 'top100_etablissements_mathadata.csv'
print(f"💾 Génération du fichier {output_file}...")

with open(output_file, 'w', encoding='utf-8', newline='') as f:
    writer = csv.writer(f)
    writer.writerow([
        'UAI',
        'Nom établissement',
        'Nombre de séances',
        'Nombre de profs',
        'Nombre d\'élèves',
        'Académie',
        'Ville'
    ])
    
    for rang, (uai, data) in enumerate(top100, 1):
        writer.writerow([
            uai,
            data['nom'],
            data['nb_seances'],
            len(data['profs']),
            len(data['eleves']),
            data['academie'],
            data['commune']
        ])

print(f"   ✓ Fichier généré avec {len(top100)} établissements")
print()

# Statistiques sur le top 100
print("📈 Statistiques du Top 100:")
total_seances = sum(data['nb_seances'] for _, data in top100)
total_profs = sum(len(data['profs']) for _, data in top100)
total_eleves = sum(len(data['eleves']) for _, data in top100)

print(f"\n   Total:")
print(f"      - {total_seances:,} séances")
print(f"      - {total_profs:,} profs")
print(f"      - {total_eleves:,} élèves")

print(f"\n   Top 5 établissements:")
for rang, (uai, data) in enumerate(top100[:5], 1):
    print(f"\n   {rang}. {data['nom']} ({data['commune']})")
    print(f"      - {data['nb_seances']:,} séances")
    print(f"      - {len(data['profs'])} profs")
    print(f"      - {len(data['eleves'])} élèves")
    print(f"      - Académie : {data['academie']}")

print(f"\n✅ Fichier exporté : {output_file}")
