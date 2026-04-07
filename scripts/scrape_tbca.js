#!/usr/bin/env node
/**
 * TBCA Web Scraper
 * Extrai dados de composição de alimentos da Tabela Brasileira de Composição de Alimentos
 * Fonte: https://www.tbca.net.br
 * 
 * Uso: node scripts/scrape_tbca.js [--pages=1-10] [--delay=1500] [--output=db/import_tbca/templates/foods_tbca.json]
 * 
 * Licença dos dados: CC BY-NC-ND 4.0 — Uso não-comercial, sem derivados.
 * Citação: TBCA, Universidade de São Paulo (USP), FoRC, Versão 7.3, 2025.
 */

const https = require('https');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const BASE_URL = 'https://www.tbca.net.br';
const LIST_URL = `${BASE_URL}/base-dados/composicao_estatistica.php`;
const DETAIL_BASE = `${BASE_URL}/base-dados/`;

const args = process.argv.slice(2).reduce((acc, a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  acc[k] = v || true;
  return acc;
}, {});

const PAGE_RANGE = (args.pages || '1-10').split('-').map(Number);
const DELAY_MS = parseInt(args.delay || '1500', 10);
const OUTPUT_FILE = args.output || path.join(__dirname, '..', 'db', 'import_tbca', 'templates', 'foods_tbca.json');

// ── Mapeamento de nutrientes TBCA → campos do projeto ───────────────────────
const NUTRIENT_MAP = {
  'Energia|kcal':         'energia_kcal',
  'Carboidrato disponível|g': 'carboidrato_g',
  'Proteína|g':           'proteina_g',
  'Lipídios|g':           'lipideos_g',
  'Fibra alimentar|g':    'fibra_g',
  'Colesterol|mg':        'colesterol_mg',
  'Ácidos graxos saturados|g': 'gordura_saturada_g',
  'Ácidos graxos monoinsaturados|g': 'gordura_monoinsaturada_g',
  'Ácidos graxos poliinsaturados|g': 'gordura_poliinsaturada_g',
  'Cálcio|mg':            'calcio_mg',
  'Ferro|mg':             'ferro_mg',
  'Sódio|mg':             'sodio_mg',
  'Magnésio|mg':          'magnesio_mg',
  'Fósforo|mg':           'fosforo_mg',
  'Potássio|mg':          'potassio_mg',
  'Zinco|mg':             'zinco_mg',
  'Cobre|mg':             'cobre_mg',
  'Selênio|mcg':          'selenio_mcg',
  'Manganês|mg':          'manganes_mg',
  'Vitamina A (RAE)|mcg': 'vitamina_a_mcg',
  'Vitamina D|mcg':       'vitamina_d_mcg',
  'Alfa-tocoferol (Vitamina E)|mg': 'vitamina_e_mg',
  'Tiamina|mg':           'vitamina_b1_mg',
  'Riboflavina|mg':       'vitamina_b2_mg',
  'Niacina|mg':           'vitamina_b3_mg',
  'Vitamina B6|mg':       'vitamina_b6_mg',
  'Vitamina B12|mcg':     'vitamina_b12_mcg',
  'Vitamina C|mg':        'vitamina_c_mg',
  'Equivalente de folato|mcg': 'folato_mcg',
};

// ── HTTP helper ─────────────────────────────────────────────────────────────
let cookies = '';

function httpGet(url, maxRedirects = 10) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      headers: {
        'User-Agent': 'Mozilla/5.0 (NutriUDF TBCA Scraper; educational use)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'Cookie': cookies,
      },
    };

    https.get(options, (res) => {
      // Save cookies
      if (res.headers['set-cookie']) {
        const newCookies = res.headers['set-cookie'].map(c => c.split(';')[0]);
        cookies = newCookies.join('; ');
      }

      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume(); // drain response
        if (maxRedirects <= 0) return reject(new Error('Too many redirects'));
        const nextUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${BASE_URL}${res.headers.location.startsWith('/') ? '' : '/base-dados/'}${res.headers.location}`;
        return resolve(httpGet(nextUrl, maxRedirects - 1));
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ── Parsing: lista de alimentos ─────────────────────────────────────────────
function parseListPage(html) {
  const $ = cheerio.load(html);
  const foods = [];

  $('table.table tbody tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 4) return;

    const codeLink = $(tds[0]).find('a');
    const code = codeLink.text().trim();
    const detailHref = codeLink.attr('href');
    const name = $(tds[1]).find('a').text().trim();
    const scientificName = $(tds[2]).find('a').text().trim();
    const category = $(tds[3]).find('a').text().trim();
    const brand = $(tds[4]) ? $(tds[4]).find('a').text().trim() : '';

    if (code && name && detailHref) {
      foods.push({
        code,
        name,
        scientific_name: scientificName || null,
        category,
        brand: brand || null,
        detail_url: detailHref.startsWith('http') ? detailHref : DETAIL_BASE + detailHref,
      });
    }
  });

  return foods;
}

// ── Parsing: detalhe nutricional ────────────────────────────────────────────
function parseNutrientValue(raw) {
  if (!raw || raw === '-' || raw === 'NA' || raw === 'ND') return null;
  if (raw === 'tr' || raw === 'Tr') return 0; // trace
  // Brazilian decimal: comma → dot
  const cleaned = raw.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function parseDetailPage(html) {
  const $ = cheerio.load(html);
  const nutrients = {};

  // Nutrient table has id='tabela1' and class='display' (NOT class='table')
  $('table#tabela1 tbody tr, table.display tbody tr').each((_, tr) => {
    const tds = $(tr).find('td');
    if (tds.length < 4) return;

    const nutrientName = $(tds[0]).text().trim();
    const unit = $(tds[2]).text().trim();
    const value = $(tds[3]).text().trim();

    const key = `${nutrientName}|${unit}`;
    const fieldName = NUTRIENT_MAP[key];

    if (fieldName) {
      nutrients[fieldName] = parseNutrientValue(value);
    }
  });

  return nutrients;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   TBCA Web Scraper — Tabela Brasileira v7.3     ║');
  console.log('║   Dados: CC BY-NC-ND 4.0 (uso educacional)     ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`Páginas: ${PAGE_RANGE[0]}-${PAGE_RANGE[1]} | Delay: ${DELAY_MS}ms`);
  console.log(`Saída: ${OUTPUT_FILE}\n`);

  // Step 1: Initialize session (visit listing page first)
  console.log('🔗 Inicializando sessão...');
  await httpGet(LIST_URL);

  // Step 2: Collect all food entries from listing pages
  const allFoods = [];
  const startPage = PAGE_RANGE[0];
  const endPage = PAGE_RANGE[1];

  for (let page = startPage; page <= endPage; page++) {
    const url = page === 1 ? LIST_URL : `${LIST_URL}?pagina=${page}`;
    console.log(`📄 Listagem página ${page}/${endPage}...`);

    const html = await httpGet(url);
    const foods = parseListPage(html);
    allFoods.push(...foods);
    console.log(`   → ${foods.length} alimentos encontrados (total: ${allFoods.length})`);

    if (page < endPage) await delay(800);
  }

  console.log(`\n✅ Total de alimentos na listagem: ${allFoods.length}`);

  // Step 3: Fetch nutrient details for each food
  const results = [];
  let errors = 0;
  let id = 1;

  for (let i = 0; i < allFoods.length; i++) {
    const food = allFoods[i];
    const progress = `[${i + 1}/${allFoods.length}]`;

    try {
      process.stdout.write(`${progress} ${food.code} ${food.name.substring(0, 50)}...`);

      const detailHtml = await httpGet(food.detail_url);
      const nutrients = parseDetailPage(detailHtml);

      const entry = {
        id: id++,
        tbca_code: food.code,
        name: food.name,
        scientific_name: food.scientific_name,
        category: food.category,
        brand: food.brand,
        reference_amount: '100g',
        // Default zeros for all nutrient fields
        energia_kcal: null,
        proteina_g: null,
        carboidrato_g: null,
        lipideos_g: null,
        fibra_g: null,
        colesterol_mg: null,
        gordura_saturada_g: null,
        gordura_monoinsaturada_g: null,
        gordura_poliinsaturada_g: null,
        calcio_mg: null,
        ferro_mg: null,
        sodio_mg: null,
        potassio_mg: null,
        magnesio_mg: null,
        zinco_mg: null,
        fosforo_mg: null,
        manganes_mg: null,
        cobre_mg: null,
        selenio_mcg: null,
        vitamina_a_mcg: null,
        vitamina_c_mg: null,
        vitamina_d_mcg: null,
        vitamina_e_mg: null,
        vitamina_b1_mg: null,
        vitamina_b2_mg: null,
        vitamina_b3_mg: null,
        vitamina_b6_mg: null,
        vitamina_b12_mcg: null,
        folato_mcg: null,
        ...nutrients,
      };

      results.push(entry);
      const kcal = entry.energia_kcal !== null ? ` (${entry.energia_kcal} kcal)` : '';
      console.log(` ✓${kcal}`);
    } catch (err) {
      console.log(` ✗ ERRO: ${err.message}`);
      errors++;
    }

    // Rate limiting
    if (i < allFoods.length - 1) {
      await delay(DELAY_MS);
    }

    // Progress save every 100 foods
    if (results.length > 0 && results.length % 100 === 0) {
      const tmpFile = OUTPUT_FILE.replace('.json', `_partial_${results.length}.json`);
      fs.mkdirSync(path.dirname(tmpFile), { recursive: true });
      fs.writeFileSync(tmpFile, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`   💾 Salvamento parcial: ${tmpFile}`);
    }
  }

  // Step 4: Save final result
  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');

  console.log('\n══════════════════════════════════════════════════');
  console.log(`✅ Scraping completo!`);
  console.log(`   Alimentos extraídos: ${results.length}`);
  console.log(`   Erros: ${errors}`);
  console.log(`   Arquivo: ${OUTPUT_FILE}`);
  console.log(`   Tamanho: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(1)} KB`);
  console.log('══════════════════════════════════════════════════');

  // Stats
  const withKcal = results.filter(f => f.energia_kcal !== null).length;
  const withProtein = results.filter(f => f.proteina_g !== null).length;
  const withVitA = results.filter(f => f.vitamina_a_mcg !== null).length;
  console.log(`\n📊 Estatísticas:`);
  console.log(`   Com energia (kcal): ${withKcal}/${results.length}`);
  console.log(`   Com proteína: ${withProtein}/${results.length}`);
  console.log(`   Com vitamina A: ${withVitA}/${results.length}`);
}

main().catch(err => {
  console.error('❌ Erro fatal:', err.message);
  process.exit(1);
});
