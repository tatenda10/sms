const express = require('express');
const router = express.Router();
const EmployeeAuthController = require('../../controllers/employees/employeeAuthController');
const { authenticateEmployeeToken } = require('../../middleware/employeeAuth');

// Public routes (no authentication required)
router.post('/login', EmployeeAuthController.login);
router.post('/set-password', EmployeeAuthController.setPassword);

// Protected routes (require employee authentication)
router.use(authenticateEmployeeToken); // Apply to all routes below

router.get('/profile', EmployeeAuthController.getProfile);
router.put('/change-password', EmployeeAuthController.changePassword);

module.exports = router;