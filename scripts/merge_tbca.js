#!/usr/bin/env node
/**
 * Merge múltiplos arquivos foods_tbca*.json em um único arquivo,
 * deduplicando por tbca_code.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'db', 'import_tbca', 'templates');
const outputFile = path.join(dir, 'foods_tbca_merged.json');

const files = fs.readdirSync(dir)
  .filter(f => f.startsWith('foods_tbca') && f.endsWith('.json') && !f.includes('merged') && !f.includes('partial'))
  .map(f => path.join(dir, f));

if (files.length === 0) {
  console.error('Nenhum arquivo foods_tbca*.json encontrado');
  process.exit(1);
}

const map = new Map();

for (const file of files) {
  const foods = JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`📄 ${path.basename(file)}: ${foods.length} alimentos`);
  for (const food of foods) {
    map.set(food.tbca_code, food);
  }
}

const merged = [...map.values()];
// Renumerar IDs
merged.forEach((f, i) => f.id = i + 1);

fs.writeFileSync(outputFile, JSON.stringify(merged, null, 2), 'utf8');
console.log(`\n✅ Merge completo: ${merged.length} alimentos únicos`);
console.log(`📁 Salvo em: ${outputFile}`);

// Stats por categoria
const cats = {};
for (const f of merged) {
  const c = f.category || 'Sem categoria';
  cats[c] = (cats[c] || 0) + 1;
}
console.log('\n📊 Categorias:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => {
  console.log(`  ${c}: ${n}`);
});
