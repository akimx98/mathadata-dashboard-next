const Papa = require('papaparse');
const fs = require('fs');

// Charger l'annuaire
const annuaireCSV = fs.readFileSync('./public/data/annuaire_etablissements.csv', 'utf-8');
const annuaire = Papa.parse(annuaireCSV, { header: true, skipEmptyLines: true }).data;
const annuaireMap = new Map(annuaire.map(a => [a.uai, a]));

// Charger les usages
const usagesCSV = fs.readFileSync('./public/data/mathadata_2025-10-08.csv', 'utf-8');
const usages = Papa.parse(usagesCSV, { header: true, skipEmptyLines: true, delimiter: ';' }).data;

// Trouver les UAI uniques dans les usages
const uaiSet = new Set();
usages.forEach(u => {
  const uai = (u.uai || '').trim();
  if (uai && uai.toLowerCase() !== 'null') uaiSet.add(uai);
});

// Filtrer les établissements privés
const etablissementsPrives = [];

uaiSet.forEach(uai => {
  const info = annuaireMap.get(uai);
  
  if (info && info.secteur === 'Privé') {
    etablissementsPrives.push({
      uai: uai,
      nom: info.nom,
      type: info.type_etablissement || 'non spécifié',
      commune: info.commune,
      academie: info.academie
    });
  }
});

// Trier par nom
etablissementsPrives.sort((a, b) => a.nom.localeCompare(b.nom));

console.log('=== ÉTABLISSEMENTS PRIVÉS AVEC AU MOINS 1 USAGE ===');
console.log(`Total: ${etablissementsPrives.length} établissements\n`);

etablissementsPrives.forEach((etab, index) => {
  console.log(`${index + 1}. ${etab.nom}`);
  console.log(`   UAI: ${etab.uai}`);
  console.log(`   Type: ${etab.type}`);
  console.log(`   Localisation: ${etab.commune} (${etab.academie})`);
  console.log('');
});
