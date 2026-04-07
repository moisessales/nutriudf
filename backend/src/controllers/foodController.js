// Food Controller — Catálogo TBCA em memória + SQL para nutrientes
// ~3500 alimentos (~2MB RAM) = busca < 1ms vs 50-200ms no TiDB Cloud
const pool = require('../config/database');

// ── Catálogo em memória com índices ──────────────────────────
let allFoods = [];           // array ordenado por nome
const foodById = new Map();  // O(1) lookup por UUID
const foodByCode = new Map();// O(1) lookup por código TBCA
let searchIndex = [];        // nomes/categorias pré-normalizados
let ready = false;

function normalize(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function loadCatalog() {
  try {
    const [rows] = await pool.query(
      'SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food ORDER BY name'
    );

    allFoods = rows;
    foodById.clear();
    foodByCode.clear();
    searchIndex = new Array(rows.length);

    for (let i = 0; i < rows.length; i++) {
      const f = rows[i];
      foodById.set(f.id, f);
      if (f.tbca_code) foodByCode.set(f.tbca_code, f);
      searchIndex[i] = {
        name: normalize(f.name),
        category: normalize(f.category),
        code: (f.tbca_code || '').toLowerCase()
      };
    }

    ready = true;
    console.log(`[Foods] ${rows.length} alimentos carregados em memória`);
  } catch (err) {
    console.error('[Foods] Falha ao carregar catálogo:', err.message);
    setTimeout(loadCatalog, 3000);
  }
}

loadCatalog();
setInterval(loadCatalog, 60 * 60 * 1000);

// Expor status para health check
exports.isReady = () => ready;

// ── Busca em memória com ranking (exact > startsWith > contains) ──
function search(term, limit) {
  const q = normalize(term);
  const exact = [];
  const prefix = [];
  const partial = [];

  for (let i = 0; i < allFoods.length; i++) {
    const idx = searchIndex[i];
    if (idx.name === q) {
      exact.push(allFoods[i]);
    } else if (idx.name.startsWith(q)) {
      prefix.push(allFoods[i]);
    } else if (idx.name.includes(q) || idx.category.includes(q) || idx.code.includes(q)) {
      partial.push(allFoods[i]);
    }
    if (exact.length + prefix.length + partial.length >= limit) break;
  }

  return exact.concat(prefix, partial).slice(0, limit);
}

// ── Cache de nutrientes (500 entries, 30min TTL) ──
const nutrientCache = new Map();
const NUTRIENT_TTL = 30 * 60 * 1000;

function getCachedNutrients(foodId) {
  const e = nutrientCache.get(foodId);
  if (!e) return null;
  if (Date.now() - e.t > NUTRIENT_TTL) { nutrientCache.delete(foodId); return null; }
  return e.d;
}

function cacheNutrients(foodId, data) {
  if (nutrientCache.size >= 500) {
    nutrientCache.delete(nutrientCache.keys().next().value);
  }
  nutrientCache.set(foodId, { d: data, t: Date.now() });
}

// ── GET /foods?query=xxx&limit=8 — busca leve (sem nutrientes) ──
exports.listFoods = (req, res) => {
  const { query, q, name, limit } = req.query;
  const searchTerm = query || q || name;
  const max = Math.min(parseInt(limit) || 20, 100);

  if (!ready) {
    return sqlFallbackSearch(searchTerm, max, res);
  }

  const foods = searchTerm ? search(searchTerm, max) : allFoods.slice(0, max);
  res.set('X-Cache', 'MEM');
  res.json(foods);
};

// ── GET /foods/:name — busca detalhada (com nutrientes para ID/código) ──
exports.getFoodByName = async (req, res) => {
  try {
    const { name } = req.params;
    const { limit } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Parâmetro obrigatório' });
    }

    // UUID ou código TBCA → busca exata com nutrientes completos
    if (/^[0-9a-f-]{36}$/i.test(name) || /^BRC\d+/i.test(name)) {
      const isCode = /^BRC/i.test(name);

      // O(1) lookup no Map em memória
      let food = ready
        ? (isCode ? foodByCode.get(name) : foodById.get(name))
        : null;

      if (!food) {
        const field = isCode ? 'tbca_code' : 'id';
        const [rows] = await pool.query(
          `SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food WHERE ${field} = ? LIMIT 1`,
          [name]
        );
        if (!rows.length) return res.status(404).json({ error: 'Não encontrado' });
        food = rows[0];
      } else {
        food = { ...food };
      }

      // Nutrientes (cache 30min)
      let nutrients = getCachedNutrients(food.id);
      if (!nutrients) {
        const [rows] = await pool.query(
          `SELECT n.slug, n.display_name, n.unit, fn.amount_per_base AS amount
           FROM food_nutrient fn JOIN nutrient n ON n.id = fn.nutrient_id
           WHERE fn.food_id = ? ORDER BY n.display_name`,
          [food.id]
        );
        nutrients = rows;
        cacheNutrients(food.id, nutrients);
      }

      food.nutrients = nutrients;
      return res.json(food);
    }

    // Busca por nome parcial (sem nutrientes)
    const max = Math.min(parseInt(limit) || 20, 100);
    if (ready) {
      return res.json(search(name, max));
    }

    return sqlFallbackSearch(name, max, res);
  } catch (error) {
    console.error('Erro ao buscar alimento:', error);
    res.status(500).json({ error: 'Erro ao buscar alimento' });
  }
};

exports.searchFoods = exports.listFoods;

// ── SQL fallback (cold start, antes do catálogo carregar) ──
async function sqlFallbackSearch(searchTerm, max, res) {
  try {
    let rows;
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      [rows] = await pool.query(
        `SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg
         FROM food WHERE name LIKE ? OR category LIKE ?
         ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, name LIMIT ?`,
        [term, term, `${searchTerm}%`, max]
      );
    } else {
      [rows] = await pool.query(
        'SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food ORDER BY name LIMIT ?',
        [max]
      );
    }
    res.set('X-Cache', 'SQL');
    return res.json(rows);
  } catch (e) {
    return res.status(503).json({ error: 'Catálogo indisponível, tente em alguns segundos' });
  }
}
