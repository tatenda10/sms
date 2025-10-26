const express = require('express');
const router = express.Router();
const SportsTeamsController = require('../../controllers/sports/sportsTeamsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all sports teams
router.get('/', SportsTeamsController.getAllTeams);

// Get team by ID
router.get('/:id', SportsTeamsController.getTeamById);

// Get team participants
router.get('/:id/participants', SportsTeamsController.getTeamParticipants);

// Create new sports team (admin/coach only)
router.post('/', requireRole(['admin', 'teacher']), SportsTeamsController.createTeam);

// Update sports team (admin/coach only)
router.put('/:id', requireRole(['admin', 'teacher']), SportsTeamsController.updateTeam);

// Delete sports team (admin only)
router.delete('/:id', requireRole(['admin']), SportsTeamsController.deleteTeam);

module.exports = router;
