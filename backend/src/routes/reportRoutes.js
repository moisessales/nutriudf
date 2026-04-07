const express = require('express');
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Todas as rotas de relatórios requerem autenticação
router.use(authMiddleware);

router.get('/patient/:patientId', reportController.getReports);
router.get('/:patientId/:reportType/:period', reportController.getReportData);
router.post('/generate-pdf', reportController.generatePDF);
router.post('/send-email', reportController.sendEmailReport);

module.exports = router;
