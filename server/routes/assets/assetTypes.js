const express = require('express');
const router = express.Router();
const assetTypesController = require('../../controllers/assets/assetTypesController');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all asset types
router.get('/', assetTypesController.getAllAssetTypes);

// Get single asset type
router.get('/:id', assetTypesController.getAssetType);

// Create new asset type
router.post('/', assetTypesController.createAssetType);

// Update asset type
router.put('/:id', assetTypesController.updateAssetType);

// Delete asset type
router.delete('/:id', assetTypesController.deleteAssetType);

module.exports = router;

