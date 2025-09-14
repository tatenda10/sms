const express = require('express');
const router = express.Router();
const resultsController = require('../../controllers/results/resultsController');
const courseworkController = require('../../controllers/results/midTermCourseworkController');
const papersController = require('../../controllers/results/papersController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Apply employee authentication to all routes (no role requirements)
router.use(authenticateEmployeeToken);

// Employee-specific results entry routes
router.post('/', resultsController.createResult);
router.post('/paper-mark', resultsController.addPaperMark);
router.put('/:id', resultsController.updateResult);
router.delete('/:id', resultsController.deleteResult);

// Employee-specific coursework routes
router.post('/coursework', courseworkController.addCoursework);
router.post('/coursework/bulk', courseworkController.bulkAddCoursework);
router.put('/coursework/:id', courseworkController.updateCoursework);
router.delete('/coursework/:id', courseworkController.deleteCoursework);

// Employee-specific papers routes
router.get('/papers', papersController.getAllPapers);
router.get('/papers/:id', papersController.getPaperById);
router.post('/papers', papersController.addPaper);
router.put('/papers/:id', papersController.updatePaper);
router.delete('/papers/:id', papersController.deletePaper);

module.exports = router;
