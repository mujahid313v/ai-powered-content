const express = require('express');
const router = express.Router();
const appealController = require('../controllers/appealController');
const { validateAppeal } = require('../middleware/validation');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/submit', authenticate, validateAppeal, appealController.submitAppeal);
router.get('/:id', authenticate, appealController.getAppealStatus);
router.post('/:id/resolve', authenticate, appealController.resolveAppeal);

module.exports = router;
