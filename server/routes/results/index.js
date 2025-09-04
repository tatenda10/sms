const express = require('express');
const router = express.Router();

// Import all results routes
const papersRoutes = require('./papers');
const gradingRoutes = require('./grading');
const resultsRoutes = require('./results');
const courseworkRoutes = require('./coursework');

// Mount routes
router.use('/papers', papersRoutes);
router.use('/grading', gradingRoutes);
router.use('/results', resultsRoutes);
router.use('/coursework', courseworkRoutes);

module.exports = router;
