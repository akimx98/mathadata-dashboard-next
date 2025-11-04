#!/usr/bin/env node

/**
 * Script d'export des données MathAData au format CSV pour analyse
 * 
 * Usage: node export_csv_by_teacher.js
 * Output: Dossier export_csv/ contenant :
 *   - teachers_summary.csv (vue d'ensemble de tous les profs)
 *   - teachers/<teacher_id>_sessions.csv (détail des séances par prof)
 *   - teachers/<teacher_id>_timeline.csv (timeline chronologique par prof)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, 'public', 'data');
const CSV_FILE = path.join(DATA_DIR, 'mathadata-V2.csv');
const ANNUAIRE_FILE = path.join(DATA_DIR, 'annuaire_etablissements.csv');
const OUTPUT_DIR = path.join(__dirname, 'export_csv');
const TEACHERS_DIR = path.join(OUTPUT_DIR, 'teachers');

// Constantes
const ONE_HOUR_MS = 3600000;

// Parse CSV simple
function parseCSV(content, delimiter = ';') {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(delimiter);
    const row = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ? values[i].replace(/"/g, '').trim() : '';
    });
    return row;
  });
}

// Parse date/timestamp
function parseDate(value) {
  if (!value) return null;
  
  // Si c'est un nombre (epoch en secondes)
  if (/^\d+$/.test(value)) {
    return new Date(parseInt(value, 10) * 1000);
  }
  
  // Si c'est une date ISO
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

// Détermine le pattern temporel
function getTimePattern(date) {
  const hour = date.getHours();
  const day = date.getDay(); // 0 = dimanche, 6 = samedi
  
  let timeOfDay;
  if (hour >= 8 && hour < 12) timeOfDay = 'morning';
  else if (hour >= 12 && hour < 14) timeOfDay = 'lunch';
  else if (hour >= 14 && hour < 18) timeOfDay = 'afternoon';
  else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
  else timeOfDay = 'night';
  
  const dayType = (day === 0 || day === 6) ? 'weekend' : 'weekday';
  
  return `${timeOfDay}_${dayType}`;
}

// Clustering temporel
function clusterSessions(sessions) {
  if (sessions.length === 0) return [];
  
  const sorted = [...sessions].sort((a, b) => a.created - b.created);
  const clusters = [];
  let currentCluster = [];
  let clusterStartTime = 0;
  
  sorted.forEach(session => {
    if (currentCluster.length === 0) {
      currentCluster.push(session);
      clusterStartTime = session.created;
    } else {
      const elapsed = session.created - clusterStartTime;
      if (elapsed <= ONE_HOUR_MS) {
        currentCluster.push(session);
      } else {
        clusters.push([...currentCluster]);
        currentCluster = [session];
        clusterStartTime = session.created;
      }
    }
  });
  
  if (currentCluster.length > 0) {
    clusters.push(currentCluster);
  }
  
  return clusters;
}

// Vérifie si l'élève a travaillé à domicile
function checkWorkAtHome(created, changed) {
  const createdDate = new Date(created);
  const changedDate = new Date(changed);
  
  // Si même jour et avant 18h
  if (changedDate.toDateString() === createdDate.toDateString()) {
    return changedDate.getHours() >= 18;
  }
  
  // Si autre jour
  const dayOfWeek = changedDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const isEvening = changedDate.getHours() >= 18 || changedDate.getHours() < 8;
  
  return isWeekend || isEvening;
}

// Analyse une séance (cluster)
function analyzeSession(cluster) {
  const students = cluster.map(s => ({
    student_id: s.student_id,
    created: s.created,
    changed: s.changed,
    work_duration_minutes: Math.round((s.changed - s.created) / 60000),
    continued_after_1h: (s.changed - s.created) > ONE_HOUR_MS,
    work_at_home: checkWorkAtHome(s.created, s.changed)
  }));
  
  const sessionDate = new Date(cluster[0].created);
  const continuationRate = students.filter(s => s.continued_after_1h).length / students.length;
  const homeWorkRate = students.filter(s => s.work_at_home).length / students.length;
  
  // Détection 2ème séance
  const sessionEnd = Math.max(...cluster.map(s => s.created)) + ONE_HOUR_MS;
  const modificationsAfter = cluster
    .filter(s => s.changed > sessionEnd)
    .sort((a, b) => a.changed - b.changed);
  
  let hasSecondSession = false;
  let secondSessionDate = null;
  let secondSessionStudents = 0;
  
  if (modificationsAfter.length >= 2) {
    const modifClusters = [];
    let currentModifCluster = [];
    let modifStartTime = 0;
    
    modificationsAfter.forEach(modif => {
      if (currentModifCluster.length === 0) {
        currentModifCluster.push(modif);
        modifStartTime = modif.changed;
      } else {
        const elapsed = modif.changed - modifStartTime;
        if (elapsed <= ONE_HOUR_MS) {
          currentModifCluster.push(modif);
        } else {
          if (currentModifCluster.length >= 2) {
            modifClusters.push([...currentModifCluster]);
          }
          currentModifCluster = [modif];
          modifStartTime = modif.changed;
        }
      }
    });
    
    if (currentModifCluster.length >= 2) {
      modifClusters.push(currentModifCluster);
    }
    
    if (modifClusters.length > 0) {
      hasSecondSession = true;
      const bestCluster = modifClusters.sort((a, b) => b.length - a.length)[0];
      secondSessionDate = bestCluster[0].changed;
      secondSessionStudents = bestCluster.length;
    }
  }
  
  return {
    date: sessionDate.toISOString().split('T')[0],
    timestamp_start: cluster[0].created,
    students,
    nb_students: students.length,
    avg_work_duration_minutes: Math.round(
      students.reduce((sum, s) => sum + s.work_duration_minutes, 0) / students.length
    ),
    continuation_rate: continuationRate,
    home_work_rate: homeWorkRate,
    had_second_session: hasSecondSession,
    second_session_date: secondSessionDate,
    second_session_students: secondSessionStudents,
    time_pattern: getTimePattern(sessionDate)
  };
}

// Calcule le chevauchement entre deux listes d'élèves
function calculateOverlap(students1, students2) {
  const set1 = new Set(students1);
  const set2 = new Set(students2);
  const intersection = [...set1].filter(s => set2.has(s));
  return intersection.length / Math.max(set1.size, set2.size);
}

// Échapper les guillemets pour CSV
function escapeCSV(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// Convertir un objet en ligne CSV
function objectToCSVRow(obj, headers) {
  return headers.map(h => escapeCSV(obj[h])).join(',');
}

// Fonction principale
async function generateCSVExport() {
  console.log('🚀 Génération de l\'export CSV par professeur...\n');
  
  // 1. Créer les dossiers
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }
  if (!fs.existsSync(TEACHERS_DIR)) {
    fs.mkdirSync(TEACHERS_DIR);
  }
  
  // 2. Charger les données
  console.log('📂 Chargement des fichiers CSV...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const annuaireContent = fs.readFileSync(ANNUAIRE_FILE, 'utf-8');
  
  const rows = parseCSV(csvContent);
  const annuaireRows = parseCSV(annuaireContent);
  
  console.log(`   ✓ ${rows.length} lignes de données chargées`);
  console.log(`   ✓ ${annuaireRows.length} établissements chargés\n`);
  
  // 3. Créer un map de l'annuaire
  const annuaireMap = new Map();
  annuaireRows.forEach(row => {
    annuaireMap.set(row.uai, {
      name: row.nom_etablissement,
      city: row.ville,
      academie: row.academie,
      type: row.type_etablissement,
      sector: row.secteur,
      ips: row.ips ? parseFloat(row.ips) : null
    });
  });
  
  // 4. Parser et enrichir les données
  console.log('⚙️  Parsing et enrichissement des données...');
  const enrichedRows = rows
    .map(row => {
      const created = parseDate(row.created);
      const changed = parseDate(row.changed);
      
      if (!created || !row.teacher) return null;
      
      return {
        student_id: row.student || null,
        teacher_id: row.teacher,
        role: row.Role,
        activity_id: row.mathadata_id,
        activity_title: row.mathadata_title || '',
        uai_el: row.uai_el || row.uai || '',
        uai_teach: row.uai_teach || '',
        created: created.getTime(),
        changed: changed ? changed.getTime() : created.getTime(),
        _date: created
      };
    })
    .filter(row => row !== null);
  
  console.log(`   ✓ ${enrichedRows.length} lignes parsées\n`);
  
  // 5. Grouper par professeur
  console.log('👨‍🏫 Analyse par professeur...');
  const teacherMap = new Map();
  
  enrichedRows.forEach(row => {
    if (!teacherMap.has(row.teacher_id)) {
      teacherMap.set(row.teacher_id, {
        teacher_id: row.teacher_id,
        schools: new Set(),
        test_sessions: [],
        student_sessions: [],
        timeline: []
      });
    }
    
    const teacher = teacherMap.get(row.teacher_id);
    
    // Ajouter école
    const uai = row.role === 'teacher' ? row.uai_teach : row.uai_el;
    if (uai) teacher.schools.add(uai);
    
    // Ajouter à la timeline
    teacher.timeline.push({
      timestamp: row.created,
      event_type: row.role === 'teacher' ? 'test' : 'teaching',
      activity_id: row.activity_id,
      activity_title: row.activity_title,
      student_id: row.student_id,
      uai: uai,
      work_duration_minutes: Math.round((row.changed - row.created) / 60000)
    });
    
    // Séparer tests et enseignement
    if (row.role === 'teacher') {
      teacher.test_sessions.push(row);
    } else if (row.role === 'student' && row.student_id) {
      teacher.student_sessions.push(row);
    }
  });
  
  console.log(`   ✓ ${teacherMap.size} professeurs identifiés\n`);
  
  // 6. Préparer teachers_summary.csv
  console.log('📊 Génération de teachers_summary.csv...');
  const summaryHeaders = [
    'teacher_id',
    'nb_schools',
    'schools_uai',
    'schools_names',
    'nb_activities',
    'nb_activities_tested',
    'nb_activities_taught',
    'nb_activities_tested_then_taught',
    'conversion_rate',
    'adoption_style',
    'total_teaching_sessions',
    'total_unique_students',
    'avg_class_size',
    'uses_multiple_classes',
    'encourages_home_work',
    'home_work_rate',
    'does_follow_up_sessions',
    'second_session_rate',
    'first_usage_date',
    'last_usage_date',
    'usage_duration_days'
  ];
  
  const summaryRows = [];
  
  // 7. Générer les fichiers par professeur
  console.log('📄 Génération des fichiers individuels par professeur...');
  let progressCount = 0;
  
  for (const [teacherId, teacherData] of teacherMap) {
    progressCount++;
    if (progressCount % 10 === 0) {
      process.stdout.write(`   Progression: ${progressCount}/${teacherMap.size}\r`);
    }
    
    // Informations des écoles
    const schools = Array.from(teacherData.schools)
      .map(uai => {
        const info = annuaireMap.get(uai);
        return { uai, ...(info || { name: 'Inconnu' }) };
      });
    
    // Trier timeline
    teacherData.timeline.sort((a, b) => a.timestamp - b.timestamp);
    
    // Analyser par activité
    const activitiesMap = new Map();
    
    // Grouper sessions élèves par activité
    teacherData.student_sessions.forEach(session => {
      if (!activitiesMap.has(session.activity_id)) {
        activitiesMap.set(session.activity_id, {
          activity_id: session.activity_id,
          activity_name: session.activity_title || `Activity ${session.activity_id}`,
          test_sessions: [],
          teaching_sessions_raw: []
        });
      }
      activitiesMap.get(session.activity_id).teaching_sessions_raw.push(session);
    });
    
    // Ajouter les tests
    teacherData.test_sessions.forEach(test => {
      if (!activitiesMap.has(test.activity_id)) {
        activitiesMap.set(test.activity_id, {
          activity_id: test.activity_id,
          activity_name: test.activity_title || `Activity ${test.activity_id}`,
          test_sessions: [],
          teaching_sessions_raw: []
        });
      }
      activitiesMap.get(test.activity_id).test_sessions.push(test);
    });
    
    // Préparer les données de sessions
    const sessionsData = [];
    let sessionGlobalNumber = 0;
    
    for (const [activityId, activityData] of activitiesMap) {
      // Tests
      const testDates = activityData.test_sessions.map(t => t.created);
      const firstTest = testDates.length > 0 ? Math.min(...testDates) : null;
      
      // Sessions d'enseignement
      if (activityData.teaching_sessions_raw.length > 0) {
        // Grouper par UAI
        const groupedByUai = new Map();
        activityData.teaching_sessions_raw.forEach(session => {
          const key = session.uai_el || 'unknown';
          if (!groupedByUai.has(key)) {
            groupedByUai.set(key, []);
          }
          groupedByUai.get(key).push(session);
        });
        
        // Pour chaque groupe UAI, faire le clustering
        const allStudentsBySession = [];
        
        for (const [uai, sessions] of groupedByUai) {
          const clusters = clusterSessions(sessions);
          
          clusters.forEach(cluster => {
            sessionGlobalNumber++;
            const analyzedSession = analyzeSession(cluster);
            const students = cluster.map(s => s.student_id);
            
            // Calculer overlap avec sessions précédentes
            let overlapRate = 0;
            let isSameStudents = null;
            if (allStudentsBySession.length > 0) {
              const prevStudents = allStudentsBySession[allStudentsBySession.length - 1];
              overlapRate = calculateOverlap(students, prevStudents);
              isSameStudents = overlapRate > 0.7;
            }
            
            // Relation avec test
            let testedFirst = false;
            let daysBetweenTestAndTeach = null;
            if (firstTest !== null) {
              testedFirst = firstTest < analyzedSession.timestamp_start;
              daysBetweenTestAndTeach = Math.round((analyzedSession.timestamp_start - firstTest) / (1000 * 60 * 60 * 24));
            }
            
            sessionsData.push({
              session_number: sessionGlobalNumber,
              activity_id: activityId,
              activity_name: activityData.activity_name,
              uai: uai,
              school_name: annuaireMap.get(uai)?.name || 'Inconnu',
              date: analyzedSession.date,
              timestamp: new Date(analyzedSession.timestamp_start).toISOString(),
              time_pattern: analyzedSession.time_pattern,
              nb_students: analyzedSession.nb_students,
              avg_work_duration_minutes: analyzedSession.avg_work_duration_minutes,
              continuation_rate: Math.round(analyzedSession.continuation_rate * 100) / 100,
              home_work_rate: Math.round(analyzedSession.home_work_rate * 100) / 100,
              had_second_session: analyzedSession.had_second_session ? 'yes' : 'no',
              second_session_date: analyzedSession.second_session_date ? new Date(analyzedSession.second_session_date).toISOString() : '',
              second_session_students: analyzedSession.second_session_students || 0,
              tested_first: testedFirst ? 'yes' : 'no',
              days_between_test_and_teaching: daysBetweenTestAndTeach !== null ? daysBetweenTestAndTeach : '',
              is_same_students_as_previous: isSameStudents !== null ? (isSameStudents ? 'yes' : 'no') : '',
              overlap_rate: allStudentsBySession.length > 0 ? Math.round(overlapRate * 100) / 100 : ''
            });
            
            allStudentsBySession.push(students);
          });
        }
      }
    }
    
    // Sauvegarder teacher_sessions.csv
    if (sessionsData.length > 0) {
      const sessionsHeaders = Object.keys(sessionsData[0]);
      const sessionsCSV = [
        sessionsHeaders.join(','),
        ...sessionsData.map(row => objectToCSVRow(row, sessionsHeaders))
      ].join('\n');
      
      const sessionsFile = path.join(TEACHERS_DIR, `${teacherId}_sessions.csv`);
      fs.writeFileSync(sessionsFile, sessionsCSV, 'utf-8');
    }
    
    // Préparer timeline
    const timelineData = teacherData.timeline.map(event => ({
      timestamp: new Date(event.timestamp).toISOString(),
      date: new Date(event.timestamp).toISOString().split('T')[0],
      event_type: event.event_type,
      activity_id: event.activity_id,
      activity_title: event.activity_title,
      student_id: event.student_id || '',
      uai: event.uai,
      school_name: annuaireMap.get(event.uai)?.name || 'Inconnu',
      work_duration_minutes: event.work_duration_minutes
    }));
    
    // Sauvegarder teacher_timeline.csv
    if (timelineData.length > 0) {
      const timelineHeaders = Object.keys(timelineData[0]);
      const timelineCSV = [
        timelineHeaders.join(','),
        ...timelineData.map(row => objectToCSVRow(row, timelineHeaders))
      ].join('\n');
      
      const timelineFile = path.join(TEACHERS_DIR, `${teacherId}_timeline.csv`);
      fs.writeFileSync(timelineFile, timelineCSV, 'utf-8');
    }
    
    // Calculer statistiques pour summary
    const testedActivities = new Set(teacherData.test_sessions.map(t => t.activity_id));
    const taughtActivities = new Set(teacherData.student_sessions.map(s => s.activity_id));
    const testedThenTaught = [...testedActivities].filter(a => taughtActivities.has(a));
    
    const allStudents = new Set(teacherData.student_sessions.map(s => s.student_id));
    const totalSessions = sessionsData.length;
    
    const usesMultipleClasses = sessionsData.some(s => s.is_same_students_as_previous === 'no');
    const homeWorkRate = sessionsData.length > 0
      ? sessionsData.reduce((sum, s) => sum + s.home_work_rate, 0) / sessionsData.length
      : 0;
    const secondSessionRate = sessionsData.length > 0
      ? sessionsData.filter(s => s.had_second_session === 'yes').length / sessionsData.length
      : 0;
    
    const avgClassSize = totalSessions > 0 ? Math.round(allStudents.size / totalSessions) : 0;
    
    // Déterminer style d'adoption
    let adoptionStyle = 'unknown';
    if (testedThenTaught.length >= taughtActivities.size * 0.7) {
      adoptionStyle = 'cautious_adopter';
    } else if (testedActivities.size === 0) {
      adoptionStyle = 'confident_direct';
    } else if (testedActivities.size > taughtActivities.size) {
      adoptionStyle = 'explorer_tester';
    } else {
      adoptionStyle = 'mixed_approach';
    }
    
    // Période d'enseignement
    const allDates = teacherData.timeline.map(e => e.timestamp);
    const firstUsage = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString().split('T')[0] : '';
    const lastUsage = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString().split('T')[0] : '';
    const durationDays = allDates.length > 0 
      ? Math.round((Math.max(...allDates) - Math.min(...allDates)) / (1000 * 60 * 60 * 24))
      : 0;
    
    const conversionRate = testedActivities.size > 0 
      ? Math.round((testedThenTaught.length / testedActivities.size) * 100) / 100
      : null;
    
    summaryRows.push({
      teacher_id: teacherId,
      nb_schools: schools.length,
      schools_uai: schools.map(s => s.uai).join('|'),
      schools_names: schools.map(s => s.name).join('|'),
      nb_activities: activitiesMap.size,
      nb_activities_tested: testedActivities.size,
      nb_activities_taught: taughtActivities.size,
      nb_activities_tested_then_taught: testedThenTaught.length,
      conversion_rate: conversionRate !== null ? conversionRate : '',
      adoption_style: adoptionStyle,
      total_teaching_sessions: totalSessions,
      total_unique_students: allStudents.size,
      avg_class_size: avgClassSize,
      uses_multiple_classes: usesMultipleClasses ? 'yes' : 'no',
      encourages_home_work: homeWorkRate > 0.1 ? 'yes' : 'no',
      home_work_rate: Math.round(homeWorkRate * 100) / 100,
      does_follow_up_sessions: secondSessionRate > 0.1 ? 'yes' : 'no',
      second_session_rate: Math.round(secondSessionRate * 100) / 100,
      first_usage_date: firstUsage,
      last_usage_date: lastUsage,
      usage_duration_days: durationDays
    });
  }
  
  console.log(`\n   ✓ ${progressCount} fichiers individuels générés\n`);
  
  // 8. Sauvegarder teachers_summary.csv
  console.log('💾 Sauvegarde de teachers_summary.csv...');
  const summaryCSV = [
    summaryHeaders.join(','),
    ...summaryRows.map(row => objectToCSVRow(row, summaryHeaders))
  ].join('\n');
  
  const summaryFile = path.join(OUTPUT_DIR, 'teachers_summary.csv');
  fs.writeFileSync(summaryFile, summaryCSV, 'utf-8');
  console.log(`   ✓ Fichier sauvegardé: ${summaryFile}\n`);
  
  // 9. Statistiques finales
  console.log('📈 Statistiques de l\'export:');
  console.log(`   • Total professeurs: ${summaryRows.length}`);
  console.log(`   • Fichiers sessions: ${progressCount}`);
  console.log(`   • Fichiers timeline: ${progressCount}`);
  
  const cautious = summaryRows.filter(t => t.adoption_style === 'cautious_adopter').length;
  const confident = summaryRows.filter(t => t.adoption_style === 'confident_direct').length;
  const explorer = summaryRows.filter(t => t.adoption_style === 'explorer_tester').length;
  
  console.log(`\n   Styles d'adoption:`);
  console.log(`   • Prudents (testent avant): ${cautious}`);
  console.log(`   • Confiants (directs): ${confident}`);
  console.log(`   • Explorateurs (testent beaucoup): ${explorer}`);
  
  const totalSize = fs.readdirSync(OUTPUT_DIR, { recursive: true })
    .filter(f => f.endsWith('.csv'))
    .reduce((sum, f) => {
      const filePath = path.join(OUTPUT_DIR, f);
      if (fs.existsSync(filePath)) {
        return sum + fs.statSync(filePath).size;
      }
      return sum;
    }, 0);
  
  console.log(`\n   Taille totale: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Dossier: ${OUTPUT_DIR}`);
  
  console.log('\n✅ Export CSV terminé avec succès!\n');
}

// Exécution
generateCSVExport().catch(err => {
  console.error('\n❌ Erreur:', err);
  process.exit(1);
});
