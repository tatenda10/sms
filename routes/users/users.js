const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/users/userController');
const { authenticateToken, requireRole, auditMiddleware } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin only)
router.get('/', requireRole(['admin']), UserController.getAllUsers);

// Get roles (admin only)
router.get('/roles', requireRole(['admin']), UserController.getRoles);

// Get user by ID (admin or self)
router.get('/:id', (req, res, next) => {
  if (req.user.roles.includes('admin') || req.user.id === parseInt(req.params.id)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}, UserController.getUserById);

// Get user roles (admin or self)
router.get('/:userId/roles', (req, res, next) => {
  if (req.user.roles.includes('admin') || req.user.id === parseInt(req.params.userId)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}, UserController.getUserRoles);

// Create user (admin only)
router.post('/', requireRole(['admin']), auditMiddleware('USER_CREATED', 'users'), UserController.createUser);

// Update user (admin or self)
router.put('/:id', (req, res, next) => {
  if (req.user.roles.includes('admin') || req.user.id === parseInt(req.params.id)) {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}, auditMiddleware('USER_UPDATED', 'users'), UserController.updateUser);

// Delete user (admin only)
router.delete('/:id', requireRole(['admin']), auditMiddleware('USER_DELETED', 'users'), UserController.deleteUser);

// Add role to user (admin only)
router.post('/:userId/roles', requireRole(['admin']), auditMiddleware('ROLE_ASSIGNED', 'user_roles'), UserController.addUserRole);

// Remove role from user (admin only)
router.delete('/:userId/roles/:roleId', requireRole(['admin']), auditMiddleware('ROLE_REMOVED', 'user_roles'), UserController.removeUserRole);

module.exports = router;
