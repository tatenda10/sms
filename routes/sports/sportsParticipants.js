const express = require('express');
const router = express.Router();
const SportsParticipantsController = require('../../controllers/sports/sportsParticipantsController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Get all sports participants
router.get('/', SportsParticipantsController.getAllParticipants);

// Get participants by team
router.get('/team/:team_id', SportsParticipantsController.getParticipantsByTeam);

// Get participant by ID
router.get('/:id', SportsParticipantsController.getParticipantById);

// Create new sports participant (admin/coach only)
router.post('/', requireRole(['admin', 'teacher']), SportsParticipantsController.createParticipant);

// Update sports participant (admin/coach only)
router.put('/:id', requireRole(['admin', 'teacher']), SportsParticipantsController.updateParticipant);

// Delete sports participant (admin/coach only)
router.delete('/:id', requireRole(['admin', 'teacher']), SportsParticipantsController.deleteParticipant);

module.exports = router;
