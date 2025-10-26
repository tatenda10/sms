const express = require('express');
const router = express.Router();
const SportsFixturesController = require('../../controllers/sports/sportsFixturesController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all sports fixtures
router.get('/', SportsFixturesController.getAllFixtures);

// Get upcoming fixtures
router.get('/upcoming', SportsFixturesController.getUpcomingFixtures);

// Get fixture by ID
router.get('/:id', SportsFixturesController.getFixtureById);

// Create new sports fixture (admin/coach only)
router.post('/', requireRole(['admin', 'teacher']), SportsFixturesController.createFixture);

// Update sports fixture (admin/coach only)
router.put('/:id', requireRole(['admin', 'teacher']), SportsFixturesController.updateFixture);

// Delete sports fixture (admin only)
router.delete('/:id', requireRole(['admin']), SportsFixturesController.deleteFixture);

module.exports = router;
