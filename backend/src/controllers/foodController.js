// Food Controller - Busca em memória (catálogo TBCA pré-carregado)
const pool = require('../config/database');

// ── Catálogo em memória ──────────────────────────────────────
let foodCatalog = [];        // array completo de alimentos
let foodCatalogLower = [];   // nomes/categorias em lowercase para busca rápida
let catalogReady = false;

function normalize(str) {
  return (str || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function loadCatalog() {
  try {
    const [rows] = await pool.query(
      'SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food ORDER BY name'
    );
    foodCatalog = rows;
    foodCatalogLower = rows.map(f => ({
      name: normalize(f.name),
      category: normalize(f.category),
      tbca_code: (f.tbca_code || '').toLowerCase()
    }));
    catalogReady = true;
    console.log(`[FoodController] Catálogo carregado: ${rows.length} alimentos em memória`);
  } catch (err) {
    console.error('[FoodController] Erro ao carregar catálogo:', err.message);
    // Retry após 5s
    setTimeout(loadCatalog, 5000);
  }
}

// Carregar ao iniciar
loadCatalog();

// Recarregar a cada 1h para pegar eventuais atualizações
setInterval(loadCatalog, 60 * 60 * 1000);

function searchInMemory(searchTerm, maxResults) {
  const term = normalize(searchTerm);
  const startsWithResults = [];
  const containsResults = [];

  for (let i = 0; i < foodCatalog.length; i++) {
    const lc = foodCatalogLower[i];
    if (lc.name.startsWith(term)) {
      startsWithResults.push(foodCatalog[i]);
    } else if (lc.name.includes(term) || lc.category.includes(term) || lc.tbca_code.includes(term)) {
      containsResults.push(foodCatalog[i]);
    }
    if (startsWithResults.length + containsResults.length >= maxResults) break;
  }

  return startsWithResults.concat(containsResults).slice(0, maxResults);
}

// Cache para buscas por ID/código com nutrientes (TTL 10min)
const detailCache = new Map();
const CACHE_TTL = 10 * 60 * 1000;

function getCachedDetail(key) {
  const entry = detailCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    detailCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCacheDetail(key, data) {
  if (detailCache.size > 200) {
    const oldest = detailCache.keys().next().value;
    detailCache.delete(oldest);
  }
  detailCache.set(key, { data, time: Date.now() });
}

/**
 * Listar alimentos ou filtrar por query em /foods (busca em memória)
 */
exports.listFoods = async (req, res) => {
  try {
    const { query, q, name, limit } = req.query;
    const searchTerm = query || q || name;
    const maxResults = Math.min(parseInt(limit) || 20, 100);

    // Se catálogo não carregou ainda, fallback para DB
    if (!catalogReady) {
      const [foods] = await pool.query(
        'SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food ORDER BY name LIMIT ?',
        [maxResults]
      );
      return res.json(foods);
    }

    let foods;
    if (searchTerm) {
      foods = searchInMemory(searchTerm, maxResults);
    } else {
      foods = foodCatalog.slice(0, maxResults);
    }

    res.set('X-Cache', 'MEM');
    res.json(foods);
  } catch (error) {
    console.error('Erro ao buscar alimentos:', error);
    res.status(500).json({ error: 'Erro ao buscar alimentos' });
  }
};

/**
 * Buscar alimento por nome/ID com micronutrientes completos
 */
exports.getFoodByName = async (req, res) => {
  try {
    const { name } = req.params;
    const { limit } = req.query;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Nome do alimento é obrigatório' });
    }

    // Verificar cache de detalhes
    const cacheKey = `food:${name}:${limit || 20}`;
    const cached = getCachedDetail(cacheKey);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Se for UUID ou código TBCA, buscar exato
    if (/^[0-9a-f-]{36}$/i.test(name) || /^BRC\d+/i.test(name)) {
      // Buscar no catálogo em memória primeiro
      let food = null;
      if (catalogReady) {
        const isCode = /^BRC/i.test(name);
        food = foodCatalog.find(f => isCode ? f.tbca_code === name : f.id === name);
      }

      if (!food) {
        const field = /^BRC/i.test(name) ? 'tbca_code' : 'id';
        const [rows] = await pool.query(
          `SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food WHERE ${field} = ?`,
          [name]
        );
        if (rows.length === 0) {
          return res.status(404).json({ error: 'Alimento não encontrado' });
        }
        food = rows[0];
      } else {
        food = { ...food };
      }

      // Buscar micronutrientes (precisa do banco)
      const [nutrients] = await pool.query(
        `SELECT n.slug, n.display_name, n.unit, fn.amount_per_base as amount
         FROM food_nutrient fn
         JOIN nutrient n ON n.id = fn.nutrient_id
         WHERE fn.food_id = ?
         ORDER BY n.display_name`,
        [food.id]
      );

      food.nutrients = nutrients;
      setCacheDetail(cacheKey, food);
      res.set('X-Cache', 'MISS');
      return res.json(food);
    }

    // Busca por nome parcial — usar memória
    const maxResults = Math.min(parseInt(limit) || 20, 100);

    if (catalogReady) {
      const foods = searchInMemory(name, maxResults);
      setCacheDetail(cacheKey, foods);
      res.set('X-Cache', 'MEM');
      return res.json(foods);
    }

    // Fallback para DB
    const term = `%${name}%`;
    const [foods] = await pool.query(
      `SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg
       FROM food
       WHERE name LIKE ? OR category LIKE ?
       ORDER BY CASE WHEN name LIKE ? THEN 0 ELSE 1 END, name
       LIMIT ?`,
      [term, term, `${name}%`, maxResults]
    );

    setCacheDetail(cacheKey, foods);
    res.json(foods);
  } catch (error) {
    console.error('Erro ao buscar alimento:', error);
    res.status(500).json({ error: 'Erro ao buscar alimento' });
  }
};

exports.searchFoods = exports.listFoods;
