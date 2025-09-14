const express = require('express');
const router = express.Router();

// Import student sports route modules
const sportsCategories = require('./sportsCategories');
const sportsTeams = require('./sportsTeams');
const sportsFixtures = require('./sportsFixtures');
const sportsAnnouncements = require('./sportsAnnouncements');

// Mount student sports routes
router.use('/categories', sportsCategories);
router.use('/teams', sportsTeams);
router.use('/fixtures', sportsFixtures);
router.use('/announcements', sportsAnnouncements);

module.exports = router;
