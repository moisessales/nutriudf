#!/usr/bin/env node
/**
 * Converte o JSON completo da TBCA (scraped) para os formatos usados pelo projeto:
 * 1. backend/src/data/tbcaFoods.json  — formato flat para o serviço local
 * 2. db/import_tbca/templates/foods.csv — para importação SQL
 * 3. db/import_tbca/templates/food_nutrients.csv — nutrientes em formato N:N
 * 
 * Uso: node scripts/convert_tbca.js [--input=...] [--update-backend]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v || true;
  return acc;
}, {});

const INPUT = args.input || path.join(__dirname, '..', 'db', 'import_tbca', 'templates', 'foods_tbca.json');
const UPDATE_BACKEND = args['update-backend'] === true || args['update-backend'] === 'true';

// ── Category mapping (TBCA → projeto) ───────────────────────────────────────
const CATEGORY_MAP = {
  'Gorduras e óleos': 'Gorduras e óleos',
  'Nozes e sementes': 'Nozes e sementes',
  'Cereais e derivados': 'Cereais e derivados',
  'Vegetais e derivados': 'Vegetais e derivados',
  'Frutas e derivados': 'Frutas e derivados',
  'Carnes e derivados': 'Carnes e derivados',
  'Pescados e frutos do mar': 'Pescados e frutos do mar',
  'Leite e derivados': 'Leite e derivados',
  'Bebidas': 'Bebidas',
  'Ovos e derivados': 'Ovos e derivados',
  'Açúcares e doces': 'Açúcares e doces',
  'Miscelâneas': 'Miscelâneas',
  'Leguminosas e derivados': 'Leguminosas e derivados',
  'Alimentos para fins especiais': 'Alimentos para fins especiais',
  'Fast food': 'Fast food',
  'Alimentos industrializados (sem preparo)': 'Alimentos industrializados',
};

function main() {
  console.log('📦 Conversor TBCA → Formatos do projeto\n');

  if (!fs.existsSync(INPUT)) {
    console.error(`❌ Arquivo não encontrado: ${INPUT}`);
    console.error('   Execute primeiro: node scripts/scrape_tbca.js');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  console.log(`   Alimentos lidos: ${raw.length}`);

  // ── 1. Backend JSON (flat format) ─────────────────────────────────────────
  const backendData = raw.map((food, i) => ({
    id: i + 1,
    tbca_code: food.tbca_code,
    name: food.name,
    category: CATEGORY_MAP[food.category] || food.category,
    reference_amount: '100g',
    energia_kcal: food.energia_kcal ?? 0,
    proteina_g: food.proteina_g ?? 0,
    carboidrato_g: food.carboidrato_g ?? 0,
    lipideos_g: food.lipideos_g ?? 0,
    fibra_g: food.fibra_g ?? 0,
    calcio_mg: food.calcio_mg ?? 0,
    ferro_mg: food.ferro_mg ?? 0,
    sodio_mg: food.sodio_mg ?? 0,
    potassio_mg: food.potassio_mg ?? 0,
    magnesio_mg: food.magnesio_mg ?? 0,
    zinco_mg: food.zinco_mg ?? 0,
    fosforo_mg: food.fosforo_mg ?? 0,
    vitamina_a_mcg: food.vitamina_a_mcg ?? 0,
    vitamina_c_mg: food.vitamina_c_mg ?? 0,
    vitamina_d_mcg: food.vitamina_d_mcg ?? 0,
    vitamina_e_mg: food.vitamina_e_mg ?? 0,
    vitamina_b1_mg: food.vitamina_b1_mg ?? 0,
    vitamina_b2_mg: food.vitamina_b2_mg ?? 0,
    vitamina_b3_mg: food.vitamina_b3_mg ?? 0,
    vitamina_b6_mg: food.vitamina_b6_mg ?? 0,
    vitamina_b12_mcg: food.vitamina_b12_mcg ?? 0,
    folato_mcg: food.folato_mcg ?? 0,
  }));

  if (UPDATE_BACKEND) {
    const backendPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'tbcaFoods.json');
    fs.mkdirSync(path.dirname(backendPath), { recursive: true });
    fs.writeFileSync(backendPath, JSON.stringify(backendData, null, 2), 'utf-8');
    console.log(`   ✅ Backend JSON: ${backendPath} (${(fs.statSync(backendPath).size / 1024).toFixed(0)} KB)`);
  }

  // ── 2. Foods CSV ──────────────────────────────────────────────────────────
  const foodsCsvPath = path.join(__dirname, '..', 'db', 'import_tbca', 'templates', 'foods.csv');
  const foodsCsvHeader = 'tbca_code,name,category,kcal,protein_g,carbs_g,fat_g,fiber_g,sodium_mg';
  const foodsCsvRows = raw.map(f => {
    const fields = [
      f.tbca_code,
      `"${(f.name || '').replace(/"/g, '""')}"`,
      `"${(CATEGORY_MAP[f.category] || f.category || '').replace(/"/g, '""')}"`,
      f.energia_kcal ?? '',
      f.proteina_g ?? '',
      f.carboidrato_g ?? '',
      f.lipideos_g ?? '',
      f.fibra_g ?? '',
      f.sodio_mg ?? '',
    ];
    return fields.join(',');
  });
  fs.writeFileSync(foodsCsvPath, [foodsCsvHeader, ...foodsCsvRows].join('\n'), 'utf-8');
  console.log(`   ✅ Foods CSV: ${foodsCsvPath} (${raw.length} rows)`);

  // ── 3. Food Nutrients CSV ─────────────────────────────────────────────────
  const nutrientsCsvPath = path.join(__dirname, '..', 'db', 'import_tbca', 'templates', 'food_nutrients.csv');
  const nutrientFields = [
    ['calcio_mg', 'calcium', 'mg'],
    ['ferro_mg', 'iron', 'mg'],
    ['potassio_mg', 'potassium', 'mg'],
    ['magnesio_mg', 'magnesium', 'mg'],
    ['zinco_mg', 'zinc', 'mg'],
    ['fosforo_mg', 'phosphorus', 'mg'],
    ['manganes_mg', 'manganese', 'mg'],
    ['cobre_mg', 'copper', 'mg'],
    ['selenio_mcg', 'selenium', 'mcg'],
    ['colesterol_mg', 'cholesterol', 'mg'],
    ['gordura_saturada_g', 'saturated-fat', 'g'],
    ['gordura_monoinsaturada_g', 'monounsaturated-fat', 'g'],
    ['gordura_poliinsaturada_g', 'polyunsaturated-fat', 'g'],
    ['vitamina_a_mcg', 'vitamin-a', 'mcg'],
    ['vitamina_c_mg', 'vitamin-c', 'mg'],
    ['vitamina_d_mcg', 'vitamin-d', 'mcg'],
    ['vitamina_e_mg', 'vitamin-e', 'mg'],
    ['vitamina_b1_mg', 'thiamine', 'mg'],
    ['vitamina_b2_mg', 'riboflavin', 'mg'],
    ['vitamina_b3_mg', 'niacin', 'mg'],
    ['vitamina_b6_mg', 'vitamin-b6', 'mg'],
    ['vitamina_b12_mcg', 'vitamin-b12', 'mcg'],
    ['folato_mcg', 'folate', 'mcg'],
  ];

  const nutCsvHeader = 'tbca_code,nutrient_slug,amount';
  const nutCsvRows = [];
  for (const food of raw) {
    for (const [field, slug] of nutrientFields) {
      const val = food[field];
      if (val !== null && val !== undefined) {
        nutCsvRows.push(`${food.tbca_code},${slug},${val}`);
      }
    }
  }
  fs.writeFileSync(nutrientsCsvPath, [nutCsvHeader, ...nutCsvRows].join('\n'), 'utf-8');
  console.log(`   ✅ Nutrients CSV: ${nutrientsCsvPath} (${nutCsvRows.length} rows)`);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const categories = {};
  raw.forEach(f => {
    const cat = CATEGORY_MAP[f.category] || f.category;
    categories[cat] = (categories[cat] || 0) + 1;
  });

  console.log('\n📊 Alimentos por categoria:');
  Object.entries(categories)
    .sort((a, b) => b[1] - a[1])
    .forEach(([cat, count]) => console.log(`   ${cat}: ${count}`));

  console.log(`\n✅ Conversão completa!`);
}

main();
