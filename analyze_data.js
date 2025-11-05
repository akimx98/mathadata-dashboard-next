const fs = require('fs');
const data = JSON.parse(fs.readFileSync('mathadata_llm_export.json', 'utf-8'));

const teachers = data.teachers;
const withTeaching = teachers.filter(t => t.profile.total_sessions > 0);

// Top 5 profs les plus actifs
const topActive = [...withTeaching].sort((a,b) => b.profile.total_sessions - a.profile.total_sessions).slice(0,5);
console.log('=== TOP 5 PROFS ACTIFS ===');
topActive.forEach((t, i) => {
  console.log(`${i+1}. Séances: ${t.profile.total_sessions} | Élèves: ${t.profile.unique_students} | Activités: ${t.profile.total_activities} | Style: ${t.behavior_analysis.adoption_style}`);
});

// Activités les plus utilisées
const activityUsage = {};
teachers.forEach(t => {
  t.activities.forEach(a => {
    if (a.teaching_sessions.length > 0) {
      if (!activityUsage[a.activity_id]) {
        activityUsage[a.activity_id] = {
          name: a.activity_name,
          teachers: 0,
          sessions: 0
        };
      }
      activityUsage[a.activity_id].teachers += 1;
      activityUsage[a.activity_id].sessions += a.teaching_sessions.length;
    }
  });
});

const topActivities = Object.entries(activityUsage).sort((a,b) => b[1].teachers - a[1].teachers).slice(0,5);
console.log('\n=== TOP 5 ACTIVITÉS ENSEIGNÉES ===');
topActivities.forEach(([id, data], i) => {
  console.log(`${i+1}. ${data.name} (${id})`);
  console.log(`   Profs: ${data.teachers} | Séances: ${data.sessions}`);
});

// Établissements multi-profs
const schoolTeachers = {};
teachers.forEach(t => {
  t.profile.schools.forEach(s => {
    if (!schoolTeachers[s.uai]) schoolTeachers[s.uai] = {name: s.name, teachers: []};
    if (!schoolTeachers[s.uai].teachers.includes(t.teacher_id)) {
      schoolTeachers[s.uai].teachers.push(t.teacher_id);
    }
  });
});

const multiProfSchools = Object.entries(schoolTeachers).filter(([uai, data]) => data.teachers.length > 1);
console.log('\n=== ÉTABLISSEMENTS MULTI-PROFS ===');
console.log(`Total: ${multiProfSchools.length}`);
multiProfSchools.slice(0,5).forEach(([uai, data]) => {
  console.log(`${uai} - ${data.name}: ${data.teachers.length} profs`);
});

// Durées d'activité
const durations = withTeaching.map(t => t.profile.teaching_period.duration_days).filter(d => d > 0);
console.log('\n=== DURÉES UTILISATION ===');
console.log(`Durée moyenne: ${Math.round(durations.reduce((a,b)=>a+b,0)/durations.length)} jours`);
console.log(`Durée médiane: ${durations.sort((a,b)=>a-b)[Math.floor(durations.length/2)]} jours`);
console.log(`Max: ${Math.max(...durations)} jours`);

// Analyse temporelle des séances
const timePatterns = {};
teachers.forEach(t => {
  t.activities.forEach(a => {
    a.teaching_sessions.forEach(s => {
      const pattern = s.session_stats.time_pattern;
      timePatterns[pattern] = (timePatterns[pattern] || 0) + 1;
    });
  });
});

console.log('\n=== PATTERNS TEMPORELS SÉANCES ===');
Object.entries(timePatterns).sort((a,b) => b[1] - a[1]).forEach(([pattern, count]) => {
  console.log(`${pattern}: ${count} séances`);
});

// Cas intéressants
console.log('\n=== CAS INTÉRESSANTS ===');

// Prof avec le plus d'élèves uniques
const maxStudents = withTeaching.reduce((max, t) => t.profile.unique_students > max.profile.unique_students ? t : max);
console.log(`Plus d'élèves: ${maxStudents.profile.unique_students} élèves | ${maxStudents.profile.total_sessions} séances | ${maxStudents.profile.total_activities} activités`);

// Prof avec le plus de classes multiples
const multiClassTeachers = withTeaching.filter(t => t.behavior_analysis.teaching_patterns.uses_multiple_classes);
if (multiClassTeachers.length > 0) {
  const topMulti = multiClassTeachers.reduce((max, t) => {
    const countClasses = t.activities.filter(a => a.activity_summary.used_with_multiple_classes).length;
    const maxCount = max.activities.filter(a => a.activity_summary.used_with_multiple_classes).length;
    return countClasses > maxCount ? t : max;
  });
  console.log(`Plus multi-classes: ${topMulti.activities.filter(a => a.activity_summary.used_with_multiple_classes).length} activités utilisées avec classes multiples`);
}

// Tests uniquement (explorateurs)
const explorers = teachers.filter(t => t.profile.total_sessions === 0 && t.behavior_analysis.nb_activities_tested_only > 0);
console.log(`\nExplorateurs (tests sans enseignement): ${explorers.length}`);
if (explorers.length > 0) {
  const topExplorer = explorers.reduce((max, t) => t.behavior_analysis.nb_activities_tested_only > max.behavior_analysis.nb_activities_tested_only ? t : max);
  console.log(`  Plus explorateur: ${topExplorer.behavior_analysis.nb_activities_tested_only} activités testées`);
}
