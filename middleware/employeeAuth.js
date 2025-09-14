const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');

/**
 * Middleware to authenticate employee JWT tokens
 */
const authenticateEmployeeToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ Invalid employee token:', err.message);
      return res.status(403).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if this is an employee token
    if (decoded.userType !== 'employee') {
      return res.status(403).json({ 
        error: 'Invalid token type - employee access required' 
      });
    }

    // Add employee info to request
    req.employeeId = decoded.employeeId;
    req.employeeNumber = decoded.employeeNumber;
    req.employeeName = decoded.fullName;
    req.employeeDepartment = decoded.department;
    req.employeeJobTitle = decoded.jobTitle;
    
    console.log('✅ Employee token validated:', {
      employeeId: decoded.employeeId,
      employeeNumber: decoded.employeeNumber,
      fullName: decoded.fullName
    });

    next();
  });
};

/**
 * Optional employee authentication - doesn't fail if no token
 */
const optionalEmployeeAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without authentication
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.userType !== 'employee') {
      return next(); // Continue without authentication
    }

    // Add employee info to request if valid
    req.employeeId = decoded.employeeId;
    req.employeeNumber = decoded.employeeNumber;
    req.employeeName = decoded.fullName;
    req.employeeDepartment = decoded.department;
    req.employeeJobTitle = decoded.jobTitle;
    
    next();
  });
};

module.exports = {
  authenticateEmployeeToken,
  optionalEmployeeAuth
};