const express = require('express');
const router = express.Router();

// Import controller
const streamController = require('../../controllers/classes/streamController');

// Import middleware
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Stream routes (academic levels: Form, Grade, ECD)
router.get('/', requireRole('CLASS_MANAGEMENT'), streamController.getAllStreams);
router.get('/:id', requireRole('CLASS_MANAGEMENT'), streamController.getStreamById);
router.post('/', requireRole('CLASS_MANAGEMENT'), streamController.createStream);
router.put('/:id', requireRole('CLASS_MANAGEMENT'), streamController.updateStream);
router.delete('/:id', requireRole('CLASS_MANAGEMENT'), streamController.deleteStream);

module.exports = router;
