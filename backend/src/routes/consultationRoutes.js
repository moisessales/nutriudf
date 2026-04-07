const express = require('express');
const consultationController = require('../controllers/consultationController');
const authMiddleware = require('../middleware/auth');
const { validateConsultation, validateIdParam } = require('../middleware/validate');

const router = express.Router();

router.use(authMiddleware);

router.get('/', consultationController.list);
router.get('/:id', validateIdParam, consultationController.getById);
router.post('/', validateConsultation, consultationController.create);
router.put('/:id', validateIdParam, validateConsultation, consultationController.update);
router.delete('/:id', validateIdParam, consultationController.remove);

module.exports = router;
