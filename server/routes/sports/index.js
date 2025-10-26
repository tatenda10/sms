const express = require('express');
const router = express.Router();

// Import sports route modules
const sportsCategories = require('./sportsCategories');
const sportsTeams = require('./sportsTeams');
const sportsFixtures = require('./sportsFixtures');
const sportsParticipants = require('./sportsParticipants');
const sportsAnnouncements = require('./sportsAnnouncements');

// Mount sports routes
router.use('/categories', sportsCategories);
router.use('/teams', sportsTeams);
router.use('/fixtures', sportsFixtures);
router.use('/participants', sportsParticipants);
router.use('/announcements', sportsAnnouncements);

module.exports = router;
