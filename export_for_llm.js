#!/usr/bin/env node

/**
 * Script d'export des données MathAData au format JSON pour analyse LLM
 * 
 * Usage: node export_for_llm.js
 * Output: mathadata_llm_export.json
 */

const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

// Configuration
const DATA_DIR = path.join(__dirname, 'public', 'data');
const ANNUAIRE_FILE = path.join(DATA_DIR, 'annuaire_etablissements.csv');
const OUTPUT_FILE = path.join(__dirname, 'mathadata_llm_export.json');

// Constantes
const ONE_HOUR_MS = 3600000;

function findLatestUsageCsv(dataDir) {
  const files = fs.readdirSync(dataDir);
  const dated = [];

  for (const file of files) {
    const m = /^(?:Mathadata|mathadata)(\d{8})\.csv$/.exec(file);
    if (m) dated.push({ file, yyyymmdd: m[1] });
  }

  dated.sort((a, b) => a.yyyymmdd.localeCompare(b.yyyymmdd));
  if (dated.length > 0) return path.join(dataDir, dated[dated.length - 1].file);

  const fallback = path.join(dataDir, 'mathadata-V2.csv');
  return fallback;
}

const CSV_FILE = findLatestUsageCsv(DATA_DIR);

function detectDelimiter(content) {
  const sample = content.slice(0, 4096);
  const semicolons = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

// Parse CSV robuste (gère ; et , + guillemets)
function parseCSV(content) {
  const delimiter = detectDelimiter(content);
  const res = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    delimiter,
    transformHeader: (header) => String(header ?? '').trim().replace(/^"+|"+$/g, ''),
    transform: (value) => {
      const v = String(value ?? '').trim();
      return v === 'NULL' ? '' : v;
    },
  });

  if (res.errors && res.errors.length > 0) {
    console.warn('[parseCSV] Erreurs détectées (extraits):', res.errors.slice(0, 5));
  }

  return res.data;
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

// Analyse une séance (cluster)
function analyzeSession(cluster) {
  const students = cluster.map(s => ({
    student_id: s.student_id,
    created: new Date(s.created).toISOString(),
    changed: new Date(s.changed).toISOString(),
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
    // Clustering sur les modifications
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
      secondSessionDate = new Date(bestCluster[0].changed).toISOString();
      secondSessionStudents = bestCluster.length;
    }
  }
  
  return {
    date: sessionDate.toISOString().split('T')[0],
    timestamp_start: sessionDate.toISOString(),
    students,
    session_stats: {
      nb_students: students.length,
      avg_work_duration_minutes: Math.round(
        students.reduce((sum, s) => sum + s.work_duration_minutes, 0) / students.length
      ),
      continuation_rate: Math.round(continuationRate * 100) / 100,
      home_work_rate: Math.round(homeWorkRate * 100) / 100,
      had_second_session: hasSecondSession,
      second_session_date: secondSessionDate,
      second_session_students: secondSessionStudents,
      time_pattern: getTimePattern(sessionDate)
    }
  };
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

// Calcule le chevauchement entre deux listes d'élèves
function calculateOverlap(students1, students2) {
  const set1 = new Set(students1);
  const set2 = new Set(students2);
  const intersection = [...set1].filter(s => set2.has(s));
  return intersection.length / Math.max(set1.size, set2.size);
}

// Fonction principale
async function generateLLMExport() {
  console.log('🚀 Génération de l\'export JSON pour analyse LLM...\n');
  
  // 1. Charger les données
  console.log('📂 Chargement des fichiers CSV...');
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const annuaireContent = fs.readFileSync(ANNUAIRE_FILE, 'utf-8');
  
  const rows = parseCSV(csvContent);
  const annuaireRows = parseCSV(annuaireContent);
  
  console.log(`   ✓ ${rows.length} lignes de données chargées`);
  console.log(`   ✓ ${annuaireRows.length} établissements chargés\n`);
  
  // 2. Créer un map de l'annuaire
  const annuaireMap = new Map();
  annuaireRows.forEach(row => {
    annuaireMap.set(row.uai, {
      name: row.nom_etablissement,
      city: row.ville,
      academie: row.academie,
      type: row.type_etablissement,
      sector: row.secteur,
      ips: row.ips ? parseFloat(row.ips) : null,
      latitude: row.latitude ? parseFloat(row.latitude) : null,
      longitude: row.longitude ? parseFloat(row.longitude) : null
    });
  });
  
  // 3. Parser et enrichir les données
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
  
  // 4. Grouper par professeur
  console.log('👨‍🏫 Analyse par professeur...');
  const teacherMap = new Map();
  
  enrichedRows.forEach(row => {
    if (!teacherMap.has(row.teacher_id)) {
      teacherMap.set(row.teacher_id, {
        teacher_id: row.teacher_id,
        schools: new Set(),
        test_sessions: [],
        student_sessions: [],
        activities: new Map(),
        timeline: []
      });
    }
    
    const teacher = teacherMap.get(row.teacher_id);
    
    // Ajouter école
    const uai = row.role === 'teacher' ? row.uai_teach : row.uai_el;
    if (uai) teacher.schools.add(uai);
    
    // Ajouter à la timeline
    teacher.timeline.push({
      timestamp: new Date(row.created).toISOString(),
      event_type: row.role === 'teacher' ? 'test' : 'teaching_session',
      activity_id: row.activity_id,
      student_id: row.student_id,
      uai: uai
    });
    
    // Séparer tests et enseignement
    if (row.role === 'teacher') {
      teacher.test_sessions.push(row);
    } else if (row.role === 'student' && row.student_id) {
      teacher.student_sessions.push(row);
    }
  });
  
  console.log(`   ✓ ${teacherMap.size} professeurs identifiés\n`);
  
  // 5. Analyser chaque professeur
  console.log('📊 Analyse détaillée de chaque professeur...');
  const teachers = [];
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
        return info ? { uai, ...info } : { uai, name: 'Inconnu' };
      });
    
    // Trier timeline
    teacherData.timeline.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Analyser par activité
    const activitiesData = [];
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
      activitiesMap.get(test.activity_id).test_sessions.push({
        timestamp: new Date(test.created).toISOString(),
        duration_minutes: Math.round((test.changed - test.created) / 60000),
        work_pattern: getTimePattern(new Date(test.created))
      });
    });
    
    // Pour chaque activité, analyser les séances
    for (const [activityId, activityData] of activitiesMap) {
      const teachingSessions = [];
      
      if (activityData.teaching_sessions_raw.length > 0) {
        // Grouper par (UAI, activité) puis clustering temporel
        const groupedByUai = new Map();
        activityData.teaching_sessions_raw.forEach(session => {
          const key = session.uai_el || 'unknown';
          if (!groupedByUai.has(key)) {
            groupedByUai.set(key, []);
          }
          groupedByUai.get(key).push(session);
        });
        
        // Pour chaque groupe UAI, faire le clustering
        let sessionNumber = 0;
        const allStudentsBySession = [];
        
        for (const [uai, sessions] of groupedByUai) {
          const clusters = clusterSessions(sessions);
          
          clusters.forEach(cluster => {
            sessionNumber++;
            const analyzedSession = analyzeSession(cluster);
            const students = cluster.map(s => s.student_id);
            
            // Calculer overlap avec sessions précédentes
            let isSameStudents = null;
            let overlapRate = 0;
            if (allStudentsBySession.length > 0) {
              const prevStudents = allStudentsBySession[allStudentsBySession.length - 1];
              overlapRate = calculateOverlap(students, prevStudents);
              isSameStudents = overlapRate > 0.7; // >70% = même classe
            }
            
            teachingSessions.push({
              session_number: sessionNumber,
              uai: uai,
              ...analyzedSession,
              is_same_students_as_previous: isSameStudents,
              overlap_rate: Math.round(overlapRate * 100) / 100
            });
            
            allStudentsBySession.push(students);
          });
        }
      }
      
      // Calcul adoption pattern
      const testDates = activityData.test_sessions.map(t => new Date(t.timestamp));
      const teachDates = teachingSessions.map(s => new Date(s.timestamp_start));
      
      let adoptionPattern = null;
      if (testDates.length > 0 && teachDates.length > 0) {
        const firstTest = Math.min(...testDates.map(d => d.getTime()));
        const firstTeach = Math.min(...teachDates.map(d => d.getTime()));
        const daysBetween = Math.round((firstTeach - firstTest) / (1000 * 60 * 60 * 24));
        
        adoptionPattern = {
          tested_first: firstTest < firstTeach,
          test_sessions: activityData.test_sessions,
          time_between_test_and_teaching_days: daysBetween
        };
      } else if (testDates.length > 0) {
        adoptionPattern = {
          tested_first: true,
          test_sessions: activityData.test_sessions,
          never_taught: true
        };
      } else if (teachDates.length > 0) {
        adoptionPattern = {
          tested_first: false,
          taught_directly: true
        };
      }
      
      // Calculer statistiques activité
      const uniqueStudents = new Set(
        activityData.teaching_sessions_raw.map(s => s.student_id)
      );
      
      const usesMultipleClasses = teachingSessions.some(
        (s, i) => i > 0 && s.is_same_students_as_previous === false
      );
      
      const hasHighContinuation = teachingSessions.some(
        s => s.session_stats.continuation_rate >= 0.5
      );
      
      const hasHomeWork = teachingSessions.some(
        s => s.session_stats.home_work_rate > 0
      );
      
      const hasSecondSessions = teachingSessions.some(
        s => s.session_stats.had_second_session
      );
      
      activitiesData.push({
        activity_id: activityId,
        activity_name: activityData.activity_name,
        adoption_pattern: adoptionPattern,
        teaching_sessions: teachingSessions,
        activity_summary: {
          total_teaching_sessions: teachingSessions.length,
          total_unique_students: uniqueStudents.size,
          used_with_multiple_classes: usesMultipleClasses,
          success_indicators: {
            high_continuation: hasHighContinuation,
            home_work_observed: hasHomeWork,
            second_sessions_observed: hasSecondSessions,
            repeated_usage: teachingSessions.length > 1
          }
        }
      });
    }
    
    // Calculer comportement global du prof
    const testedActivities = new Set(teacherData.test_sessions.map(t => t.activity_id));
    const taughtActivities = new Set(teacherData.student_sessions.map(s => s.activity_id));
    const testedThenTaught = [...testedActivities].filter(a => taughtActivities.has(a));
    
    const allStudents = new Set(teacherData.student_sessions.map(s => s.student_id));
    const allTeachingSessions = activitiesData.reduce((sum, a) => sum + a.teaching_sessions.length, 0);
    
    const usesMultipleClassesGlobal = activitiesData.some(a => a.activity_summary.used_with_multiple_classes);
    const homeWorkRate = activitiesData.reduce((sum, a) => {
      const avg = a.teaching_sessions.reduce((s, sess) => s + sess.session_stats.home_work_rate, 0) / 
                  (a.teaching_sessions.length || 1);
      return sum + avg;
    }, 0) / (activitiesData.length || 1);
    
    const secondSessionRate = activitiesData.reduce((sum, a) => {
      const count = a.teaching_sessions.filter(s => s.session_stats.had_second_session).length;
      return sum + (count / (a.teaching_sessions.length || 1));
    }, 0) / (activitiesData.length || 1);
    
    const avgClassSize = allTeachingSessions > 0 
      ? Math.round(allStudents.size / allTeachingSessions)
      : 0;
    
    // Déterminer style d'adoption
    let adoptionStyle = 'unknown';
    if (testedThenTaught.length >= taughtActivities.size * 0.7) {
      adoptionStyle = 'cautious_adopter'; // Teste avant d'enseigner
    } else if (testedActivities.size === 0) {
      adoptionStyle = 'confident_direct'; // Enseigne directement
    } else if (testedActivities.size > taughtActivities.size) {
      adoptionStyle = 'explorer_tester'; // Teste beaucoup, enseigne peu
    } else {
      adoptionStyle = 'mixed_approach';
    }
    
    // Période d'enseignement
    const allDates = teacherData.timeline.map(e => new Date(e.timestamp).getTime());
    const firstUsage = allDates.length > 0 ? new Date(Math.min(...allDates)).toISOString() : null;
    const lastUsage = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : null;
    const durationDays = allDates.length > 0 
      ? Math.round((Math.max(...allDates) - Math.min(...allDates)) / (1000 * 60 * 60 * 24))
      : 0;
    
    teachers.push({
      teacher_id: teacherId,
      profile: {
        schools: schools,
        total_activities: activitiesData.length,
        total_sessions: allTeachingSessions,
        unique_students: allStudents.size,
        teaching_period: {
          first_usage: firstUsage,
          last_usage: lastUsage,
          duration_days: durationDays
        }
      },
      activities: activitiesData,
      behavior_analysis: {
        adoption_style: adoptionStyle,
        testing_before_teaching: testedThenTaught.length > 0,
        nb_activities_tested_only: testedActivities.size - taughtActivities.size,
        nb_activities_taught: taughtActivities.size,
        conversion_rate: testedActivities.size > 0 
          ? Math.round((testedThenTaught.length / testedActivities.size) * 100) / 100
          : null,
        teaching_patterns: {
          uses_multiple_classes: usesMultipleClassesGlobal,
          encourages_home_work: homeWorkRate > 0.1,
          does_follow_up_sessions: secondSessionRate > 0.1,
          average_class_size: avgClassSize,
          home_work_rate: Math.round(homeWorkRate * 100) / 100,
          second_session_rate: Math.round(secondSessionRate * 100) / 100
        },
        timeline: teacherData.timeline
      }
    });
  }
  
  console.log(`\n   ✓ Analyse terminée\n`);
  
  // 6. Analyser par établissement
  console.log('🏫 Analyse par établissement...');
  const schoolSummaries = [];
  const schoolTeachers = new Map();
  
  teachers.forEach(teacher => {
    teacher.profile.schools.forEach(school => {
      if (!schoolTeachers.has(school.uai)) {
        schoolTeachers.set(school.uai, {
          uai: school.uai,
          name: school.name,
          teachers: []
        });
      }
      schoolTeachers.get(school.uai).teachers.push(teacher.teacher_id);
    });
  });
  
  for (const [uai, data] of schoolTeachers) {
    const teachersInSchool = teachers.filter(t => 
      t.profile.schools.some(s => s.uai === uai)
    );
    
    const testersCount = teachersInSchool.filter(t => 
      t.behavior_analysis.testing_before_teaching
    ).length;
    
    const multipleTeachers = teachersInSchool.length > 1;
    
    let usagePattern = 'unknown';
    let evidence = [];
    
    if (multipleTeachers && testersCount > 0) {
      usagePattern = 'progressive_deployment';
      evidence.push('Multiple teachers');
      evidence.push('Tests followed by teaching');
    } else if (multipleTeachers) {
      usagePattern = 'collaborative_usage';
      evidence.push('Multiple teachers');
    } else if (testersCount > 0) {
      usagePattern = 'single_teacher_exploration';
      evidence.push('Single teacher testing');
    } else {
      usagePattern = 'direct_usage';
      evidence.push('Direct teaching without testing');
    }
    
    schoolSummaries.push({
      uai: data.uai,
      name: data.name,
      nb_teachers: teachersInSchool.length,
      teachers: data.teachers,
      usage_pattern: usagePattern,
      evidence: evidence.join(', ')
    });
  }
  
  console.log(`   ✓ ${schoolSummaries.length} établissements analysés\n`);
  
  // 7. Créer l'objet final
  const exportData = {
    metadata: {
      date_export: new Date().toISOString(),
      total_usages: enrichedRows.length,
      total_teachers: teachers.length,
      total_schools: schoolSummaries.length,
      clustering_window_ms: ONE_HOUR_MS,
      clustering_window_description: '1 hour'
    },
    teachers: teachers,
    school_summaries: schoolSummaries
  };
  
  // 8. Sauvegarder
  console.log('💾 Sauvegarde du fichier JSON...');
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(exportData, null, 2), 'utf-8');
  console.log(`   ✓ Fichier sauvegardé: ${OUTPUT_FILE}\n`);
  
  // 9. Statistiques finales
  console.log('📈 Statistiques de l\'export:');
  console.log(`   • Total professeurs: ${teachers.length}`);
  console.log(`   • Total établissements: ${schoolSummaries.length}`);
  console.log(`   • Total usages analysés: ${enrichedRows.length}`);
  
  const cautious = teachers.filter(t => t.behavior_analysis.adoption_style === 'cautious_adopter').length;
  const confident = teachers.filter(t => t.behavior_analysis.adoption_style === 'confident_direct').length;
  const explorer = teachers.filter(t => t.behavior_analysis.adoption_style === 'explorer_tester').length;
  
  console.log(`\n   Styles d'adoption:`);
  console.log(`   • Prudents (testent avant): ${cautious}`);
  console.log(`   • Confiants (directs): ${confident}`);
  console.log(`   • Explorateurs (testent beaucoup): ${explorer}`);
  
  const fileSize = fs.statSync(OUTPUT_FILE).size;
  console.log(`\n   Taille du fichier: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
  
  console.log('\n✅ Export terminé avec succès!\n');
}

// Exécution
generateLLMExport().catch(err => {
  console.error('\n❌ Erreur:', err);
  process.exit(1);
});
