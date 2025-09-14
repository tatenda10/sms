const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const AuditLogger = require('../utils/audit');

const JWT_SECRET = process.env.JWT_SECRET;

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user details from database
    const connection = await pool.getConnection();
    const [users] = await connection.execute(`
      SELECT 
        u.*,
        GROUP_CONCAT(r.name) as roles,
        GROUP_CONCAT(r.id) as role_ids
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id 
      WHERE u.id = ? AND u.is_active = 1
      GROUP BY u.id, u.username, u.password, u.is_active, u.last_login, u.created_at, u.updated_at
    `, [decoded.userId]);
    
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    // Process roles for the user
    const user = {
      ...users[0],
      roles: users[0].roles ? users[0].roles.split(',') : [],
      roleIds: users[0].role_ids ? users[0].role_ids.split(',').map(id => parseInt(id)) : []
    };

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = Array.isArray(roles) 
      ? roles.some(role => userRoles.includes(role))
      : userRoles.includes(roles);

    if (!hasRequiredRole) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const auditMiddleware = (action, tableName = null) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = async function(data) {
      try {
        // Log the action after the response is sent
        const auditData = {
          userId: req.user ? req.user.id : null,
          action: action,
          tableName: tableName,
          recordId: req.params.id || null,
          oldValues: req.method === 'PUT' || req.method === 'DELETE' ? req.body : null,
          newValues: req.method === 'POST' || req.method === 'PUT' ? req.body : null,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent')
        };

        await AuditLogger.log(auditData);
      } catch (error) {
        console.error('Audit logging failed:', error);
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  auditMiddleware,
  JWT_SECRET
};
