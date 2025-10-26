const express = require('express');
const router = express.Router();
const SportsTeamsController = require('../../controllers/sports/sportsTeamsController');
const { authenticateStudentToken } = require('../../middleware/studentAuth');

// Apply student authentication to all routes
router.use(authenticateStudentToken);

// Get all sports teams (read-only for students)
router.get('/', SportsTeamsController.getAllTeams);

// Get team by ID (read-only for students)
router.get('/:id', SportsTeamsController.getTeamById);

// Get participants by team ID (read-only for students)
router.get('/:id/participants', SportsTeamsController.getTeamParticipants);

module.exports = router;
