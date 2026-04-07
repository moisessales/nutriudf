const express = require('express');
const patientController = require('../controllers/patientController');
const authMiddleware = require('../middleware/auth');
const { validatePatient, validateIdParam } = require('../middleware/validate');

const router = express.Router();

// Todas as rotas de pacientes requerem autenticação
router.use(authMiddleware);

router.get('/', patientController.listPatients);
router.post('/', validatePatient, patientController.createPatient);
router.get('/:id', validateIdParam, patientController.getPatient);
router.put('/:id', validateIdParam, validatePatient, patientController.updatePatient);
router.delete('/:id', validateIdParam, patientController.deletePatient);

module.exports = router;
