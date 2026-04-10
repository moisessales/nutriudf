const express = require('express');
const authMiddleware = require('../middleware/auth');
const profileController = require('../controllers/profileController');

const router = express.Router();

router.use(authMiddleware);

router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.put('/email', profileController.changeEmail);
router.put('/password', profileController.changePassword);
router.delete('/', profileController.deleteAccount);

module.exports = router;
