const Papa = require('papaparse');
const fs = require('fs');

// Charger l'annuaire
const annuaireCSV = fs.readFileSync('./public/data/annuaire_etablissements.csv', 'utf-8');
const annuaire = Papa.parse(annuaireCSV, { header: true, skipEmptyLines: true }).data;
const annuaireMap = new Map(annuaire.map(a => [a.uai, a]));

console.log('=== ANNUAIRE ===');
console.log('Total établissements dans annuaire:', annuaire.length);

// Compter par type dans l'annuaire
let lyceesAnnuaire = 0;
let collegesAnnuaire = 0;
let autresAnnuaire = 0;
annuaire.forEach(a => {
  if (a.type_etablissement === 'lycee') lyceesAnnuaire++;
  else if (a.type_etablissement === 'college') collegesAnnuaire++;
  else autresAnnuaire++;
});
console.log('Lycées dans annuaire:', lyceesAnnuaire);
console.log('Collèges dans annuaire:', collegesAnnuaire);
console.log('Autres/vide dans annuaire:', autresAnnuaire);

// Charger les usages
const usagesCSV = fs.readFileSync('./public/data/mathadata_2025-10-08.csv', 'utf-8');
const usages = Papa.parse(usagesCSV, { header: true, skipEmptyLines: true, delimiter: ';' }).data;

console.log('\n=== USAGES ===');
console.log('Total lignes usages:', usages.length);

// Trouver les UAI uniques dans les usages (en filtrant null/NULL)
const uaiSet = new Set();
usages.forEach(u => {
  const uai = (u.uai || '').trim();
  if (uai && uai.toLowerCase() !== 'null') uaiSet.add(uai);
});

console.log('Total UAI uniques (hors null):', uaiSet.size);

// Analyser chaque UAI
let nombreLycees = 0;
let nombreColleges = 0;
let nombrePublics = 0;
let nombrePrives = 0;
let nombreInconnus = 0;

const uaisInconnus = [];

uaiSet.forEach(uai => {
  const info = annuaireMap.get(uai);
  
  if (!info) {
    nombreInconnus++;
    uaisInconnus.push(uai);
    return;
  }
  
  // Par type
  if (info.type_etablissement === 'lycee') {
    nombreLycees++;
  } else if (info.type_etablissement === 'college') {
    nombreColleges++;
  }
  
  // Par secteur
  if (info.secteur === 'Public') {
    nombrePublics++;
  } else if (info.secteur === 'Privé') {
    nombrePrives++;
  }
});

console.log('\n=== STATISTIQUES (établissements avec au moins 1 usage) ===');
console.log('Nombre de lycées:', nombreLycees);
console.log('Nombre de collèges:', nombreColleges);
console.log('Établissements publics:', nombrePublics);
console.log('Établissements privés:', nombrePrives);
console.log('Établissements absents de l\'annuaire:', nombreInconnus);
console.log('\nTotal (lycées + collèges + inconnus):', nombreLycees + nombreColleges + nombreInconnus);
console.log('Vérification (public + privé + inconnus):', nombrePublics + nombrePrives + nombreInconnus);

if (uaisInconnus.length > 0) {
  console.log('\nUAI absents de l\'annuaire:', uaisInconnus);
}
