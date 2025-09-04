const express = require('express');
const router = express.Router();
const ConfigurationsController = require('../../controllers/employees/configurationsController');
const { authenticateToken, requireRole, auditMiddleware } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All configuration routes require admin or HR access
router.use(requireRole(['admin', 'hr']));

// ==========================================
// DEPARTMENT ROUTES
// ==========================================

// Get all departments
router.get('/departments', ConfigurationsController.getAllDepartments);

// Create new department
router.post('/departments', auditMiddleware('DEPARTMENT_CREATED', 'departments'), ConfigurationsController.createDepartment);

// Update department
router.put('/departments/:id', auditMiddleware('DEPARTMENT_UPDATED', 'departments'), ConfigurationsController.updateDepartment);

// Delete department
router.delete('/departments/:id', auditMiddleware('DEPARTMENT_DELETED', 'departments'), ConfigurationsController.deleteDepartment);

// ==========================================
// JOB TITLE ROUTES
// ==========================================

// Get all job titles
router.get('/job-titles', ConfigurationsController.getAllJobTitles);

// Create new job title
router.post('/job-titles', auditMiddleware('JOB_TITLE_CREATED', 'job_titles'), ConfigurationsController.createJobTitle);

// Update job title
router.put('/job-titles/:id', auditMiddleware('JOB_TITLE_UPDATED', 'job_titles'), ConfigurationsController.updateJobTitle);

// Delete job title
router.delete('/job-titles/:id', auditMiddleware('JOB_TITLE_DELETED', 'job_titles'), ConfigurationsController.deleteJobTitle);

// ==========================================
// UTILITY ROUTES
// ==========================================

// Get active departments and job titles for dropdowns
router.get('/active', ConfigurationsController.getActiveConfigurations);

module.exports = router;
