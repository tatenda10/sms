const express = require('express');
const router = express.Router();
const HostelController = require('../../controllers/boarding/hostelController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);

// Hostel management routes
router.post('/', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), HostelController.createHostel);
router.get('/', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), HostelController.getAllHostels);
router.get('/:id', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), HostelController.getHostelById);
router.put('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), HostelController.updateHostel);
router.delete('/:id', requireRole(['BOARDING_MANAGEMENT', 'ADMIN']), HostelController.deleteHostel);

// Hostel-specific routes
router.get('/:id/rooms', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), HostelController.getHostelRooms);
router.get('/:id/enrollments', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), HostelController.getHostelEnrollments);
router.get('/:id/billing-fees', requireRole(['BOARDING_MANAGEMENT', 'BOARDING_VIEW', 'ADMIN']), HostelController.getHostelBillingFees);

module.exports = router;
