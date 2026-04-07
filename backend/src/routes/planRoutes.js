const express = require('express');
const planController = require('../controllers/planController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de planos requerem autenticação
router.use(authMiddleware);

router.get('/patient/:patientId', planController.getPlanByPatient);
router.post('/', planController.createPlan);
router.put('/:planId', planController.updatePlan);

module.exports = router;
