const express = require('express');
const router = express.Router();
const AuthController = require('../../controllers/users/auth/authController');
const { authenticateToken, requireRole, auditMiddleware } = require('../../middleware/auth');

// Public routes
router.post('/login', auditMiddleware('LOGIN_ATTEMPT', 'users'), AuthController.login);
router.post('/register', auditMiddleware('REGISTER_ATTEMPT', 'users'), AuthController.register);

// Protected routes
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/change-password', authenticateToken, auditMiddleware('PASSWORD_CHANGE_ATTEMPT', 'users'), AuthController.changePassword);

module.exports = router;
