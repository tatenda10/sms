const express = require('express');
const router = express.Router();

// Import individual route files
const streamRoutes = require('./streams');
const gradelevelClassRoutes = require('./gradelevelClasses');
const subjectRoutes = require('./subjects');
const subjectClassRoutes = require('./subjectClasses');
const gradelevelEnrollmentRoutes = require('./gradelevelEnrollments');
const subjectEnrollmentRoutes = require('./subjectEnrollments');

// Import class term year routes
const classTermYearRoutes = require('./classTermYear');

// Mount routes with descriptive prefixes
router.use('/streams', streamRoutes);
router.use('/gradelevel-classes', gradelevelClassRoutes);
router.use('/subjects', subjectRoutes);
router.use('/subject-classes', subjectClassRoutes);
router.use('/gradelevel-enrollments', gradelevelEnrollmentRoutes);
router.use('/subject-enrollments', subjectEnrollmentRoutes);

// Mount class term year routes
router.use('/class-term-years', classTermYearRoutes);

module.exports = router;
