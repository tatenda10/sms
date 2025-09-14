const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const InvoiceStructureController = require('../controllers/fees/invoiceStructureController');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Invoice Structures routes (tuition fees only)
router.get('/invoice-structures', requireRole(['INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE', 'ADMIN']), InvoiceStructureController.getAllInvoiceStructures);
router.get('/invoice-structures/:id', requireRole(['INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE', 'ADMIN']), InvoiceStructureController.getInvoiceStructureById);
router.post('/invoice-structures', requireRole(['INVOICE_CREATE', 'ADMIN']), InvoiceStructureController.createInvoiceStructure);
router.put('/invoice-structures/:id', requireRole(['INVOICE_UPDATE', 'ADMIN']), InvoiceStructureController.updateInvoiceStructure);
router.delete('/invoice-structures/:id', requireRole(['INVOICE_DELETE', 'ADMIN']), InvoiceStructureController.deleteInvoiceStructure);

// Get invoice structures by class
router.get('/invoice-structures/class/:gradelevel_class_id', requireRole(['INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE', 'ADMIN']), InvoiceStructureController.getInvoiceStructuresByClass);

// Get invoice items by structure
router.get('/invoice-structures/:invoice_structure_id/items', requireRole(['INVOICE_VIEW', 'INVOICE_CREATE', 'INVOICE_UPDATE', 'INVOICE_DELETE', 'ADMIN']), InvoiceStructureController.getInvoiceItemsByStructure);

module.exports = router;
