const fs = require('fs/promises');
const path = require('path');
const http = require('http');
const https = require('https');

// ── Configuração ──────────────────────────────────────────────
const TBCAX_API_URL = process.env.TBCAX_API_URL || 'http://localhost:3001/api';
const TBCA_FOODS_PATH = process.env.TBCA_FOODS_PATH
  ? path.resolve(process.cwd(), process.env.TBCA_FOODS_PATH)
  : path.join(__dirname, '..', 'data', 'tbcaFoods.json');

let cachedLocalFoods = null;
let cachedLocalIndex = null;
let tbcaxAvailable = null; // null = não testado
let tbcaxLastCheck = 0;
const TBCAX_CHECK_INTERVAL = 60_000; // re-testa disponibilidade a cada 60s

// ── Helpers de texto ──────────────────────────────────────────
function normalizeText(value) {
  return (value || '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function safeFloat(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const str = value.toString().trim().toLowerCase();
  if (!str || str === 'na' || str === 'nd' || str === '-' || str === 'tr') return 0;
  const n = parseFloat(str.replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

// ── HTTP fetch genérico (sem dependência externa) ─────────────
function httpGet(url, timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout: timeoutMs }, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        res.resume();
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString()));
        } catch (e) {
          reject(new Error('JSON inválido'));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// ── Verificar disponibilidade da API tbcax ────────────────────
async function isTbcaxAvailable() {
  const now = Date.now();
  if (tbcaxAvailable !== null && now - tbcaxLastCheck < TBCAX_CHECK_INTERVAL) {
    return tbcaxAvailable;
  }
  try {
    await httpGet(`${TBCAX_API_URL}/`, 3000);
    tbcaxAvailable = true;
    console.log('✅ API tbcax disponível em', TBCAX_API_URL);
  } catch {
    tbcaxAvailable = false;
    console.log('ℹ️ API tbcax indisponível, usando dados locais');
  }
  tbcaxLastCheck = now;
  return tbcaxAvailable;
}

// ── Mapeamento: componentes tbcax → campos planos ─────────────
const COMPONENTE_MAP = {
  'energia': 'energia_kcal',
  'energia (kcal)': 'energia_kcal',
  'calorias': 'energia_kcal',
  'proteina': 'proteina_g',
  'proteinas': 'proteina_g',
  'carboidrato': 'carboidrato_g',
  'carboidrato total': 'carboidrato_g',
  'carboidratos': 'carboidrato_g',
  'lipideos': 'lipideos_g',
  'lipidios': 'lipideos_g',
  'gorduras totais': 'lipideos_g',
  'gordura total': 'lipideos_g',
  'fibra alimentar': 'fibra_g',
  'fibra': 'fibra_g',
  'calcio': 'calcio_mg',
  'ferro': 'ferro_mg',
  'sodio': 'sodio_mg',
  'potassio': 'potassio_mg',
  'magnesio': 'magnesio_mg',
  'zinco': 'zinco_mg',
  'fosforo': 'fosforo_mg',
  'cobre': 'cobre_mg',
  'selenio': 'selenio_mcg',
  'vitamina a (rae)': 'vitamina_a_mcg',
  'vitamina a (re)': 'vitamina_a_mcg',
  'vitamina a': 'vitamina_a_mcg',
  're': 'vitamina_a_mcg',
  'rae': 'vitamina_a_mcg',
  'vitamina c': 'vitamina_c_mg',
  'acido ascorbico': 'vitamina_c_mg',
  'vitamina d': 'vitamina_d_mcg',
  'vitamina e': 'vitamina_e_mg',
  'tiamina': 'vitamina_b1_mg',
  'vitamina b1': 'vitamina_b1_mg',
  'riboflavina': 'vitamina_b2_mg',
  'vitamina b2': 'vitamina_b2_mg',
  'niacina': 'vitamina_b3_mg',
  'vitamina b3': 'vitamina_b3_mg',
  'piridoxina': 'vitamina_b6_mg',
  'vitamina b6': 'vitamina_b6_mg',
  'cobalamina': 'vitamina_b12_mcg',
  'vitamina b12': 'vitamina_b12_mcg',
  'folato': 'folato_mcg',
  'acido folico': 'folato_mcg',
};

function mapTbcaxFood(tbcaxFood) {
  const flat = {
    id: tbcaxFood.codigo || tbcaxFood._id,
    name: tbcaxFood.nome || '',
    code: tbcaxFood.codigo || '',
    category: tbcaxFood.grupo || '',
    reference_amount: '100g',
    scientific_name: tbcaxFood.nomeCientifico || '',
    name_en: tbcaxFood.nomeIngles || '',
  };

  if (Array.isArray(tbcaxFood.componentes)) {
    for (const comp of tbcaxFood.componentes) {
      const key = normalizeText(comp.componente);
      const field = COMPONENTE_MAP[key];
      if (field) {
        flat[field] = safeFloat(comp.valorPor100g);
      }
    }
  }

  return flat;
}

// ── Fonte tbcax: buscar via API ───────────────────────────────
async function tbcaxSearch(query, limit = 20) {
  const url = `${TBCAX_API_URL}/alimentos/search?q=${encodeURIComponent(query)}&pagina=1`;
  const results = await httpGet(url, 5000);
  if (!Array.isArray(results)) return [];

  // A busca do tbcax retorna apenas dados básicos, precisamos enriquecer
  // Mas o endpoint /id/:codigo retorna tudo. Vamos buscar detalhes dos primeiros resultados.
  const foods = [];
  const toFetch = results
    .filter(r => r.codigo)
    .slice(0, Math.min(limit, 20));

  const details = await Promise.allSettled(
    toFetch.map(r => httpGet(`${TBCAX_API_URL}/id/${encodeURIComponent(r.codigo)}`, 5000))
  );

  for (const result of details) {
    if (result.status === 'fulfilled' && result.value) {
      foods.push(mapTbcaxFood(result.value));
    }
  }

  return foods.slice(0, limit);
}

async function tbcaxGetByCode(code) {
  const data = await httpGet(`${TBCAX_API_URL}/id/${encodeURIComponent(code)}`, 5000);
  return data ? mapTbcaxFood(data) : null;
}

async function tbcaxList(pagina = 1) {
  const url = `${TBCAX_API_URL}/alimentos?pagina=${pagina}`;
  const results = await httpGet(url, 8000);
  if (!Array.isArray(results)) return [];
  return results.map(mapTbcaxFood);
}

// ── Fonte local: tbcaFoods.json ───────────────────────────────
function normalizeFoodRecord(food, index) {
  return {
    ...food,
    id: Number.parseInt(food.id, 10) || index + 1,
    code: food.code || food.tbca_code || (food.id || '').toString(),
    category: food.category || food.group || '',
  };
}

async function loadLocalFoods() {
  if (cachedLocalFoods && cachedLocalIndex) {
    return { foods: cachedLocalFoods, index: cachedLocalIndex };
  }

  const rawContent = await fs.readFile(TBCA_FOODS_PATH, 'utf8');
  const parsedFoods = JSON.parse(rawContent);

  if (!Array.isArray(parsedFoods)) {
    throw new Error('Fonte TBCA local invalida');
  }

  cachedLocalFoods = parsedFoods.map((food, i) => normalizeFoodRecord(food, i));

  cachedLocalIndex = cachedLocalFoods.map((food) => ({
    food,
    normalizedName: normalizeText(food.name),
    normalizedCode: normalizeText(food.code),
    normalizedCategory: normalizeText(food.category),
    searchableText: [food.name, food.code, food.category]
      .map(normalizeText)
      .filter(Boolean)
      .join(' '),
  }));

  return { foods: cachedLocalFoods, index: cachedLocalIndex };
}

function sortMatches(searchTerm, matches) {
  return matches.sort((a, b) => {
    const aScore = [
      a.normalizedCode === searchTerm ? 0 : 1,
      a.normalizedName === searchTerm ? 0 : 1,
      a.normalizedCode.startsWith(searchTerm) ? 0 : 1,
      a.normalizedName.startsWith(searchTerm) ? 0 : 1,
      a.searchableText.includes(searchTerm) ? 0 : 1,
    ];
    const bScore = [
      b.normalizedCode === searchTerm ? 0 : 1,
      b.normalizedName === searchTerm ? 0 : 1,
      b.normalizedCode.startsWith(searchTerm) ? 0 : 1,
      b.normalizedName.startsWith(searchTerm) ? 0 : 1,
      b.searchableText.includes(searchTerm) ? 0 : 1,
    ];
    for (let i = 0; i < aScore.length; i++) {
      if (aScore[i] !== bScore[i]) return aScore[i] - bScore[i];
    }
    if (a.normalizedName.length !== b.normalizedName.length) {
      return a.normalizedName.length - b.normalizedName.length;
    }
    return a.normalizedName.localeCompare(b.normalizedName);
  });
}

async function localSearch(name, limit) {
  const searchTerm = normalizeText(name);
  if (!searchTerm) return [];

  const { index } = await loadLocalFoods();
  const matches = index.filter((e) => e.searchableText.includes(searchTerm));
  const sorted = sortMatches(searchTerm, matches).map((e) => e.food);

  return (Number.isInteger(limit) && limit > 0) ? sorted.slice(0, limit) : sorted;
}

// ── API pública do serviço ────────────────────────────────────
async function listFoods(options = {}) {
  const limit = Number.parseInt(options.limit, 10);

  if (await isTbcaxAvailable()) {
    try {
      const foods = await tbcaxList(1);
      return (Number.isInteger(limit) && limit > 0) ? foods.slice(0, limit) : foods;
    } catch (err) {
      console.warn('⚠️ Erro tbcax listFoods, fallback local:', err.message);
    }
  }

  const { foods } = await loadLocalFoods();
  return (Number.isInteger(limit) && limit > 0) ? foods.slice(0, limit) : foods;
}

async function getFoodById(id) {
  if (await isTbcaxAvailable()) {
    try {
      const food = await tbcaxGetByCode(id);
      if (food) return food;
    } catch (err) {
      console.warn('⚠️ Erro tbcax getFoodById, fallback local:', err.message);
    }
  }

  const parsedId = Number.parseInt(id, 10);
  const { foods } = await loadLocalFoods();
  return foods.find((f) => f.id === parsedId || f.code === String(id)) || null;
}

async function findFoodsByName(name, options = {}) {
  const limit = Number.parseInt(options.limit, 10) || 20;

  if (await isTbcaxAvailable()) {
    try {
      const foods = await tbcaxSearch(name, limit);
      if (foods.length > 0) return foods;
    } catch (err) {
      console.warn('⚠️ Erro tbcax findFoodsByName, fallback local:', err.message);
    }
  }

  return localSearch(name, limit);
}

module.exports = {
  getFoodById,
  listFoods,
  findFoodsByName,
};
