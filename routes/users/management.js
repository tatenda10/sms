const express = require('express');
const router = express.Router();
const UserController = require('../../controllers/users/management/userController');
const RoleController = require('../../controllers/users/management/roleController');
const { authenticateToken, requireRole, auditMiddleware } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// User Management Routes (admin only)
router.get('/users', requireRole(['admin']), UserController.getAllUsers);
router.get('/users/search', requireRole(['admin']), UserController.searchUsers);
router.get('/users/:id', requireRole(['admin']), UserController.getUserById);
router.post('/users', requireRole(['admin']), auditMiddleware('USER_CREATED', 'users'), UserController.createUser);
router.put('/users/:id', requireRole(['admin']), auditMiddleware('USER_UPDATED', 'users'), UserController.updateUser);
router.patch('/users/:id/toggle-status', requireRole(['admin']), auditMiddleware('USER_STATUS_CHANGED', 'users'), UserController.toggleUserStatus);
router.delete('/users/:id', requireRole(['admin']), auditMiddleware('USER_DELETED', 'users'), UserController.deleteUser);

// Role Management Routes (admin only)
router.get('/roles', requireRole(['admin']), RoleController.getAllRoles);
router.get('/roles/search', requireRole(['admin']), RoleController.searchRoles);
router.get('/roles/:id', requireRole(['admin']), RoleController.getRoleById);
router.get('/roles/:id/users', requireRole(['admin']), RoleController.getRoleUsers);
router.post('/roles', requireRole(['admin']), auditMiddleware('ROLE_CREATED', 'roles'), RoleController.createRole);
router.put('/roles/:id', requireRole(['admin']), auditMiddleware('ROLE_UPDATED', 'roles'), RoleController.updateRole);
router.patch('/roles/:id/toggle-status', requireRole(['admin']), auditMiddleware('ROLE_STATUS_CHANGED', 'roles'), RoleController.toggleRoleStatus);
router.delete('/roles/:id', requireRole(['admin']), auditMiddleware('ROLE_DELETED', 'roles'), RoleController.deleteRole);

// Permission Management Routes (admin only)
router.get('/permissions', requireRole(['admin']), RoleController.getAvailablePermissions);

module.exports = router;
