const express = require('express');
const router = express.Router();
const supplierController = require('../../controllers/expenses/supplierController');
const { authenticateToken, requireRole } = require('../../middleware/auth');

router.use(authenticateToken);
router.use(requireRole('EXPENSES_MANAGEMENT'));

router.get('/', supplierController.getAllSuppliers);
router.get('/:id', supplierController.getSupplierById);
router.post('/', supplierController.createSupplier);
router.put('/:id', supplierController.updateSupplier);
router.delete('/:id', supplierController.deleteSupplier);

module.exports = router;
