const express = require('express');
const foodController = require('../controllers/foodController');

const router = express.Router();

// Rotas de busca de alimentos são públicas (sem autenticação)
// para permitir busca no frontend mesmo sem login

// Listar alimentos
router.get('/', foodController.listFoods);

// Buscar alimentos
router.get('/search', foodController.searchFoods);

// Buscar alimentos por nome parcial ou por ID/código
router.get('/:name', foodController.getFoodByName);

module.exports = router;
