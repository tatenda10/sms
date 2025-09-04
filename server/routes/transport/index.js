const express = require('express');
const router = express.Router();
const simplifiedTransportRoutes = require('./simplified');

// Use simplified transport routes
router.use('/', simplifiedTransportRoutes);

module.exports = router;
