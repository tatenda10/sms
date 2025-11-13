const express = require('express');
const router = express.Router();
const fixedAssetsController = require('../../controllers/assets/fixedAssetsController');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all assets
router.get('/', fixedAssetsController.getAllAssets);

// Get asset summary
router.get('/summary/totals', fixedAssetsController.getAssetSummary);

// Get single asset
router.get('/:id', fixedAssetsController.getAsset);

// Create new asset
router.post('/', fixedAssetsController.createAsset);

// Update asset details
router.put('/:id', fixedAssetsController.updateAsset);

// Make payment on asset
router.post('/:id/payments', fixedAssetsController.makePayment);

module.exports = router;

