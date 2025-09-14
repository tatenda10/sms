const express = require('express');
const router = express.Router();
const RoomController = require('../../controllers/boarding/roomController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Room management routes
router.post('/', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), RoomController.createRoom);
router.get('/', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), RoomController.getAllRooms);
router.get('/:id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), RoomController.getRoomById);
router.put('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), RoomController.updateRoom);
router.delete('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), RoomController.deleteRoom);

// Room-specific routes
router.get('/:id/enrollments', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), RoomController.getRoomEnrollments);

// Available rooms route
router.get('/available/:hostel_id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), RoomController.getAvailableRooms);

module.exports = router;
