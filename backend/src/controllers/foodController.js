// Food Controller - Busca no banco MySQL (TBCA importada)
const pool = require('../config/database');

/**
 * Listar alimentos ou filtrar por query em /foods
 */
exports.listFoods = async (req, res) => {
  try {
    const { query, q, name, limit } = req.query;
    const searchTerm = query || q || name;
    const maxResults = Math.min(parseInt(limit) || 20, 100);

    const connection = await pool.getConnection();

    let foods;
    if (searchTerm) {
      const term = `%${searchTerm}%`;
      [foods] = await connection.query(
        `SELECT f.id, f.tbca_code, f.name, f.category, f.kcal, f.protein_g, f.carbs_g, f.fat_g, f.fiber_g, f.sodium_mg
         FROM food f
         WHERE f.name LIKE ? OR f.tbca_code LIKE ? OR f.category LIKE ?
         ORDER BY
           CASE WHEN f.name LIKE ? THEN 0 ELSE 1 END,
           f.name
         LIMIT ?`,
        [term, term, term, `${searchTerm}%`, maxResults]
      );
    } else {
      [foods] = await connection.query(
        'SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food ORDER BY name LIMIT ?',
        [maxResults]
      );
    }

    connection.release();
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

    const connection = await pool.getConnection();

    // Se for UUID ou código TBCA, buscar exato
    if (/^[0-9a-f-]{36}$/i.test(name) || /^BRC\d+/i.test(name)) {
      const field = /^BRC/i.test(name) ? 'tbca_code' : 'id';
      const [rows] = await connection.query(
        `SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg FROM food WHERE ${field} = ?`,
        [name]
      );

      if (rows.length === 0) {
        connection.release();
        return res.status(404).json({ error: 'Alimento não encontrado' });
      }

      const food = rows[0];

      // Buscar micronutrientes
      const [nutrients] = await connection.query(
        `SELECT n.slug, n.display_name, n.unit, fn.amount_per_base as amount
         FROM food_nutrient fn
         JOIN nutrient n ON n.id = fn.nutrient_id
         WHERE fn.food_id = ?
         ORDER BY n.display_name`,
        [food.id]
      );

      food.nutrients = nutrients;
      connection.release();
      return res.json(food);
    }

    // Busca por nome parcial
    const maxResults = Math.min(parseInt(limit) || 20, 100);
    const term = `%${name}%`;
    const [foods] = await connection.query(
      `SELECT id, tbca_code, name, category, kcal, protein_g, carbs_g, fat_g, fiber_g, sodium_mg
       FROM food
       WHERE name LIKE ? OR category LIKE ?
       ORDER BY
         CASE WHEN name LIKE ? THEN 0 ELSE 1 END,
         name
       LIMIT ?`,
      [term, term, `${name}%`, maxResults]
    );

    connection.release();
    res.json(foods);
  } catch (error) {
    console.error('Erro ao buscar alimento:', error);
    res.status(500).json({ error: 'Erro ao buscar alimento' });
  }
};

exports.searchFoods = exports.listFoods;
