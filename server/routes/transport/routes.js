const express = require('express');
const router = express.Router();
const TransportRouteController = require('../../controllers/transport/transportRouteController');
const { requireRole } = require('../../middleware/auth');

// Apply authentication middleware
router.use(requireRole('TRANSPORT_MANAGEMENT'));

// Get all transport routes
router.get('/', TransportRouteController.getAllRoutes);

// Get route by ID
router.get('/:id', TransportRouteController.getRouteById);

// Create new route
router.post('/', TransportRouteController.createRoute);

// Update route
router.put('/:id', TransportRouteController.updateRoute);

// Delete route
router.delete('/:id', TransportRouteController.deleteRoute);

// Get route statistics
router.get('/stats/summary', TransportRouteController.getRouteStats);

module.exports = router;
