const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de dashboard requerem autenticação
router.use(authMiddleware);

// Estatísticas gerais do dashboard
router.get('/stats', dashboardController.getDashboardStats);

// Estatísticas avançadas de um paciente
router.get('/patient/:patientId', dashboardController.getPatientAdvancedStats);

module.exports = router;
