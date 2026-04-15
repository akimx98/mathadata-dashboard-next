#!/usr/bin/env python3
import csv
from datetime import datetime
from collections import defaultdict

print("📊 Analyse comparative : Septembre-Décembre 2024 vs 2025\n")
print("="*80)

# Lire les données
rows = []
with open('public/data/mathadata_2025-10-08.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f, delimiter=';')
    for row in reader:
        rows.append(row)

print(f"Total de lignes chargées : {len(rows):,}\n")

# Fonction pour extraire la période
def get_period(timestamp_str):
    try:
        ts = int(timestamp_str)
        dt = datetime.fromtimestamp(ts)
        return dt.year, dt.month
    except:
        return None, None

# Filtrer les périodes septembre-décembre 2024 et 2025
data_2024 = []
data_2025 = []

for row in rows:
    year, month = get_period(row.get('created', ''))
    if year and 9 <= month <= 12:
        if year == 2024:
            data_2024.append(row)
        elif year == 2025:
            data_2025.append(row)

print(f"📅 Période Sept-Déc 2024 : {len(data_2024):,} sessions")
print(f"📅 Période Sept-Déc 2025 : {len(data_2025):,} sessions")
print(f"Evolution : {((len(data_2025) - len(data_2024)) / len(data_2024) * 100):+.1f}%\n")
print("="*80)

# Fonction d'analyse
def analyze_period(data, period_name):
    print(f"\n{period_name}")
    print("-"*80)
    
    # UAI distincts
    uais = set()
    for row in data:
        uai = (row.get('uai') or row.get('uai_el', '')).strip()
        if uai and uai.lower() != 'null':
            uais.add(uai)
    
    # Profs distincts
    teachers = set()
    for row in data:
        teacher = row.get('teacher', '').strip()
        if teacher:
            teachers.add(teacher)
    
    # Élèves distincts
    students = set()
    for row in data:
        student = row.get('student', '').strip()
        if student:
            students.add(student)
    
    # Activités
    activities = defaultdict(int)
    for row in data:
        activity = row.get('mathadata_title', '').strip()
        if activity:
            activities[activity] += 1
    
    # Répartition par mois
    monthly = defaultdict(int)
    for row in data:
        year, month = get_period(row.get('created', ''))
        if year and month:
            monthly[f"{year}-{month:02d}"] += 1
    
    print(f"\n📊 Statistiques globales:")
    print(f"   • Sessions totales : {len(data):,}")
    print(f"   • Établissements : {len(uais)}")
    print(f"   • Professeurs : {len(teachers)}")
    print(f"   • Élèves : {len(students)}")
    
    print(f"\n📈 Répartition mensuelle:")
    for month in sorted(monthly.keys()):
        print(f"   • {month} : {monthly[month]:,} sessions")
    
    print(f"\n📚 Top 10 activités les plus utilisées:")
    top_activities = sorted(activities.items(), key=lambda x: x[1], reverse=True)[:10]
    for i, (activity, count) in enumerate(top_activities, 1):
        pct = (count / len(data)) * 100
        print(f"   {i:2d}. {activity[:60]:60s} : {count:4d} ({pct:5.1f}%)")
    
    # Sessions par prof (moyenne)
    if teachers:
        avg_sessions_per_teacher = len(data) / len(teachers)
        print(f"\n👨‍🏫 Moyenne sessions/prof : {avg_sessions_per_teacher:.1f}")
    
    # Sessions par élève (moyenne)
    if students:
        avg_sessions_per_student = len(data) / len(students)
        print(f"🎓 Moyenne sessions/élève : {avg_sessions_per_student:.1f}")
    
    return {
        'sessions': len(data),
        'uais': len(uais),
        'teachers': len(teachers),
        'students': len(students),
        'activities': activities,
        'monthly': monthly,
        'avg_sessions_per_teacher': avg_sessions_per_teacher if teachers else 0,
        'avg_sessions_per_student': avg_sessions_per_student if students else 0
    }

# Analyser les deux périodes
stats_2024 = analyze_period(data_2024, "🗓️  SEPTEMBRE-DÉCEMBRE 2024")
stats_2025 = analyze_period(data_2025, "🗓️  SEPTEMBRE-DÉCEMBRE 2025")

# Comparaison
print("\n" + "="*80)
print("🔍 COMPARAISON 2024 vs 2025")
print("="*80)

print(f"\n📊 Croissance:")
print(f"   • Sessions : {stats_2024['sessions']:,} → {stats_2025['sessions']:,} ({((stats_2025['sessions'] - stats_2024['sessions']) / stats_2024['sessions'] * 100):+.1f}%)")
print(f"   • Établissements : {stats_2024['uais']} → {stats_2025['uais']} ({((stats_2025['uais'] - stats_2024['uais']) / stats_2024['uais'] * 100):+.1f}%)")
print(f"   • Professeurs : {stats_2024['teachers']} → {stats_2025['teachers']} ({((stats_2025['teachers'] - stats_2024['teachers']) / stats_2024['teachers'] * 100):+.1f}%)")
print(f"   • Élèves : {stats_2024['students']} → {stats_2025['students']} ({((stats_2025['students'] - stats_2024['students']) / stats_2024['students'] * 100):+.1f}%)")

print(f"\n👨‍🏫 Engagement des professeurs:")
print(f"   • 2024 : {stats_2024['avg_sessions_per_teacher']:.1f} sessions/prof")
print(f"   • 2025 : {stats_2025['avg_sessions_per_teacher']:.1f} sessions/prof")
print(f"   • Evolution : {((stats_2025['avg_sessions_per_teacher'] - stats_2024['avg_sessions_per_teacher']) / stats_2024['avg_sessions_per_teacher'] * 100):+.1f}%")

print(f"\n🎓 Engagement des élèves:")
print(f"   • 2024 : {stats_2024['avg_sessions_per_student']:.1f} sessions/élève")
print(f"   • 2025 : {stats_2025['avg_sessions_per_student']:.1f} sessions/élève")
print(f"   • Evolution : {((stats_2025['avg_sessions_per_student'] - stats_2024['avg_sessions_per_student']) / stats_2024['avg_sessions_per_student'] * 100):+.1f}%")

# Nouvelles activités en 2025
activities_2024 = set(stats_2024['activities'].keys())
activities_2025 = set(stats_2025['activities'].keys())
new_activities = activities_2025 - activities_2024

if new_activities:
    print(f"\n🆕 Nouvelles activités en 2025 ({len(new_activities)}) :")
    for activity in sorted(new_activities):
        count = stats_2025['activities'][activity]
        print(f"   • {activity[:70]:70s} : {count:4d} sessions")

# Activités en baisse
print(f"\n📉 Activités avec forte baisse d'usage :")
common_activities = activities_2024 & activities_2025
declining = []
for activity in common_activities:
    count_2024 = stats_2024['activities'][activity]
    count_2025 = stats_2025['activities'][activity]
    if count_2024 >= 10:  # Seulement si usage significatif en 2024
        change = ((count_2025 - count_2024) / count_2024) * 100
        if change < -20:
            declining.append((activity, count_2024, count_2025, change))

declining.sort(key=lambda x: x[3])
for activity, count_2024, count_2025, change in declining[:10]:
    print(f"   • {activity[:50]:50s} : {count_2024:4d} → {count_2025:4d} ({change:+.0f}%)")

# Activités en hausse
print(f"\n📈 Activités avec forte hausse d'usage :")
growing = []
for activity in common_activities:
    count_2024 = stats_2024['activities'][activity]
    count_2025 = stats_2025['activities'][activity]
    if count_2024 >= 5:  # Seulement si usage en 2024
        change = ((count_2025 - count_2024) / count_2024) * 100
        if change > 50:
            growing.append((activity, count_2024, count_2025, change))

growing.sort(key=lambda x: x[3], reverse=True)
for activity, count_2024, count_2025, change in growing[:10]:
    print(f"   • {activity[:50]:50s} : {count_2024:4d} → {count_2025:4d} ({change:+.0f}%)")

print("\n" + "="*80)
print("✅ Analyse terminée")
