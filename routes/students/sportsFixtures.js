const express = require('express');
const router = express.Router();
const SportsFixturesController = require('../../controllers/sports/sportsFixturesController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Apply student authentication to all routes
router.use(authenticateStudentToken);

// Get all sports fixtures (read-only for students)
router.get('/', SportsFixturesController.getAllFixtures);

// Get fixture by ID (read-only for students)
router.get('/:id', SportsFixturesController.getFixtureById);

// Get upcoming fixtures (read-only for students)
router.get('/upcoming/list', SportsFixturesController.getUpcomingFixtures);

module.exports = router;
