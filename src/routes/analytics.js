const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/dashboard', authenticate, requireRole('moderator'), analyticsController.getDashboard);

module.exports = router;
