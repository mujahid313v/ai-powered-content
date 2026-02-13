const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { validateContentSubmission } = require('../middleware/validation');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/submit', authenticate, validateContentSubmission, contentController.submitContent);
router.post('/batch', authenticate, contentController.batchSubmit);
router.get('/:id/status', authenticate, contentController.getContentStatus);

module.exports = router;
