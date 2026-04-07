#!/usr/bin/env node
/**
 * Importa alimentos da TBCA (foods_tbca.json) para o banco MySQL.
 * Insere em food, garante nutrientes em nutrient, e preenche food_nutrient.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Carregar .env do backend
const backendDir = path.join(__dirname, '..', 'backend');
require(path.join(backendDir, 'node_modules', 'dotenv')).config({ path: path.join(backendDir, '.env') });

const mysql = require(path.join(backendDir, 'node_modules', 'mysql2', 'promise'));

const cliArgs = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v || true;
  return acc;
}, {});
const JSON_PATH = cliArgs.input
  ? path.resolve(cliArgs.input)
  : path.join(__dirname, '..', 'db', 'import_tbca', 'templates', 'foods_tbca.json');

// Mapeamento campo JSON → slug do nutrient
const NUTRIENT_MAP = {
  calcio_mg:                { slug: 'calcium',             display: 'Cálcio',              unit: 'mg' },
  ferro_mg:                 { slug: 'iron',                display: 'Ferro',               unit: 'mg' },
  sodio_mg:                 { slug: 'sodium',              display: 'Sódio',               unit: 'mg' },
  potassio_mg:              { slug: 'potassium',           display: 'Potássio',            unit: 'mg' },
  magnesio_mg:              { slug: 'magnesium',           display: 'Magnésio',            unit: 'mg' },
  zinco_mg:                 { slug: 'zinc',                display: 'Zinco',               unit: 'mg' },
  fosforo_mg:               { slug: 'phosphorus',          display: 'Fósforo',             unit: 'mg' },
  manganes_mg:              { slug: 'manganese',           display: 'Manganês',            unit: 'mg' },
  cobre_mg:                 { slug: 'copper',              display: 'Cobre',               unit: 'mg' },
  selenio_mcg:              { slug: 'selenium',            display: 'Selênio',             unit: 'mcg' },
  colesterol_mg:            { slug: 'cholesterol',         display: 'Colesterol',          unit: 'mg' },
  gordura_saturada_g:       { slug: 'saturated-fat',       display: 'Gordura Saturada',    unit: 'g' },
  gordura_monoinsaturada_g: { slug: 'monounsaturated-fat', display: 'Gordura Monoinsaturada', unit: 'g' },
  gordura_poliinsaturada_g: { slug: 'polyunsaturated-fat', display: 'Gordura Poliinsaturada', unit: 'g' },
  vitamina_a_mcg:           { slug: 'vitamin-a',           display: 'Vitamina A',          unit: 'mcg' },
  vitamina_c_mg:            { slug: 'vitamin-c',           display: 'Vitamina C',          unit: 'mg' },
  vitamina_d_mcg:           { slug: 'vitamin-d',           display: 'Vitamina D',          unit: 'mcg' },
  vitamina_e_mg:            { slug: 'vitamin-e',           display: 'Vitamina E',          unit: 'mg' },
  vitamina_b1_mg:           { slug: 'thiamine',            display: 'Tiamina (B1)',        unit: 'mg' },
  vitamina_b2_mg:           { slug: 'riboflavin',          display: 'Riboflavina (B2)',    unit: 'mg' },
  vitamina_b3_mg:           { slug: 'niacin',              display: 'Niacina (B3)',        unit: 'mg' },
  vitamina_b6_mg:           { slug: 'vitamin-b6',          display: 'Vitamina B6',         unit: 'mg' },
  vitamina_b12_mcg:         { slug: 'vitamin-b12',         display: 'Vitamina B12',        unit: 'mcg' },
  folato_mcg:               { slug: 'folate',              display: 'Folato',              unit: 'mcg' },
  // Macros como nutrientes também (para food_nutrient completo)
  proteina_g:               { slug: 'protein',             display: 'Proteína',            unit: 'g' },
  carboidrato_g:            { slug: 'carbohydrate',        display: 'Carboidrato',         unit: 'g' },
  lipideos_g:               { slug: 'fat',                 display: 'Gordura',             unit: 'g' },
  fibra_g:                  { slug: 'fiber',               display: 'Fibra',               unit: 'g' },
};

async function main() {
  console.log('📥 Lendo dados TBCA...');
  const foods = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
  console.log(`📊 ${foods.length} alimentos encontrados no JSON`);

  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  const connection = await pool.getConnection();

  try {
    // 1. Garantir todos os nutrientes existem
    console.log('\n🧬 Sincronizando nutrientes...');
    const nutrientIdMap = {}; // slug → id

    for (const [field, info] of Object.entries(NUTRIENT_MAP)) {
      const [existing] = await connection.query(
        'SELECT id FROM nutrient WHERE slug = ?', [info.slug]
      );

      if (existing.length > 0) {
        nutrientIdMap[info.slug] = existing[0].id;
      } else {
        const id = crypto.randomUUID();
        await connection.query(
          'INSERT INTO nutrient (id, slug, display_name, unit) VALUES (?, ?, ?, ?)',
          [id, info.slug, info.display, info.unit]
        );
        nutrientIdMap[info.slug] = id;
        console.log(`  ✅ Nutriente criado: ${info.display} (${info.slug})`);
      }
    }
    console.log(`  Total nutrientes: ${Object.keys(nutrientIdMap).length}`);

    // 2. Importar alimentos
    console.log('\n🍎 Importando alimentos...');
    let inserted = 0, updated = 0, errors = 0;

    for (const food of foods) {
      try {
        const [existing] = await connection.query(
          'SELECT id FROM food WHERE tbca_code = ?', [food.tbca_code]
        );

        let foodId;

        if (existing.length > 0) {
          foodId = existing[0].id;
          await connection.query(
            `UPDATE food SET name = ?, category = ?, kcal = ?, protein_g = ?, carbs_g = ?, fat_g = ?, fiber_g = ?, sodium_mg = ? WHERE id = ?`,
            [
              food.name, food.category || null,
              food.energia_kcal || 0, food.proteina_g || 0,
              food.carboidrato_g || 0, food.lipideos_g || 0,
              food.fibra_g || 0, food.sodio_mg || 0,
              foodId
            ]
          );
          updated++;
        } else {
          foodId = crypto.randomUUID();
          await connection.query(
            `INSERT INTO food (id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              foodId, food.tbca_code, food.name, food.category || null,
              food.energia_kcal || 0, food.proteina_g || 0,
              food.carboidrato_g || 0, food.lipideos_g || 0,
              food.fibra_g || 0, food.sodio_mg || 0,
            ]
          );
          inserted++;
        }

        // 3. Inserir micronutrientes para este alimento
        // Deletar existentes e reinserir (idempotente)
        await connection.query('DELETE FROM food_nutrient WHERE food_id = ?', [foodId]);

        for (const [field, info] of Object.entries(NUTRIENT_MAP)) {
          const amount = food[field];
          if (amount === null || amount === undefined || amount === '') continue;
          const numAmount = parseFloat(amount);
          if (isNaN(numAmount)) continue;

          const nutrientId = nutrientIdMap[info.slug];
          if (!nutrientId) continue;

          await connection.query(
            'INSERT INTO food_nutrient (id, food_id, nutrient_id, amount_per_base) VALUES (?, ?, ?, ?)',
            [crypto.randomUUID(), foodId, nutrientId, numAmount]
          );
        }

        if ((inserted + updated) % 100 === 0) {
          process.stdout.write(`  📦 ${inserted + updated}/${foods.length} processados...\r`);
        }
      } catch (err) {
        errors++;
        if (errors <= 5) {
          console.error(`  ❌ Erro no alimento ${food.tbca_code} (${food.name}):`, err.message);
        }
      }
    }

    console.log(`\n\n✅ Importação concluída!`);
    console.log(`  📥 Inseridos: ${inserted}`);
    console.log(`  🔄 Atualizados: ${updated}`);
    console.log(`  ❌ Erros: ${errors}`);

    // Contagem final
    const [countFood] = await connection.query('SELECT COUNT(*) as c FROM food');
    const [countFN] = await connection.query('SELECT COUNT(*) as c FROM food_nutrient');
    const [countN] = await connection.query('SELECT COUNT(*) as c FROM nutrient');
    console.log(`\n📊 Banco de dados:`);
    console.log(`  Alimentos: ${countFood[0].c}`);
    console.log(`  Nutrientes: ${countN[0].c}`);
    console.log(`  Relações food↔nutrient: ${countFN[0].c}`);

  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch(err => {
  console.error('💥 Erro fatal:', err);
  process.exit(1);
});
