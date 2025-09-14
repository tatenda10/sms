const express = require('express');
const router = express.Router();
const AuditController = require('../../controllers/audit/auditController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get audit logs (admin and auditor only)
router.get('/', requireRole(['admin', 'auditor']), AuditController.getAuditLogs);

// Get audit log by ID (admin and auditor only)
router.get('/:id', requireRole(['admin', 'auditor']), AuditController.getAuditLogById);

// Get audit statistics (admin and auditor only)
router.get('/stats/overview', requireRole(['admin', 'auditor']), AuditController.getAuditStats);

// Export audit logs (admin and auditor only)
router.get('/export/data', requireRole(['admin', 'auditor']), AuditController.exportAuditLogs);

module.exports = router; 
