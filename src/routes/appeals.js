const express = require('express');
const router = express.Router();
const appealController = require('../controllers/appealController');
const { validateAppeal } = require('../middleware/validation');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/pending', authenticate, requireRole('moderator'), appealController.getPendingAppeals);
router.post('/submit', authenticate, validateAppeal, appealController.submitAppeal);
router.get('/:id', authenticate, appealController.getAppealStatus);
router.post('/:id/resolve', authenticate, requireRole('moderator'), appealController.resolveAppeal);

module.exports = router;
