const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, requireRole } = require('../middleware/authMiddleware');

router.get('/queue', authenticate, requireRole('moderator'), adminController.getReviewQueue);
router.post('/:id/approve', authenticate, requireRole('moderator'), adminController.approveContent);
router.post('/:id/reject', authenticate, requireRole('moderator'), adminController.rejectContent);
router.post('/bulk', authenticate, requireRole('moderator'), adminController.bulkAction);

module.exports = router;
