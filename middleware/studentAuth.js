const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('./auth');

/**
 * Middleware to authenticate student JWT tokens
 */
const authenticateStudentToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ Invalid student token:', err.message);
      return res.status(403).json({ 
        error: 'Invalid or expired token' 
      });
    }

    // Check if this is a student token
    if (decoded.userType !== 'student') {
      return res.status(403).json({ 
        error: 'Invalid token type - student access required' 
      });
    }

    // Add student info to request
    req.student = {
      regNumber: decoded.regNumber,
      studentId: decoded.studentId,
      fullName: decoded.fullName,
      gradelevelClass: decoded.gradelevelClass,
      stream: decoded.stream
    };
    
    console.log('✅ Student token validated:', {
      regNumber: decoded.regNumber,
      fullName: decoded.fullName
    });

    next();
  });
};

/**
 * Optional student authentication - doesn't fail if no token
 */
const optionalStudentAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next(); // Continue without authentication
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.userType !== 'student') {
      return next(); // Continue without authentication
    }

    // Add student info to request if valid
    req.student = {
      regNumber: decoded.regNumber,
      studentId: decoded.studentId,
      fullName: decoded.fullName,
      gradelevelClass: decoded.gradelevelClass,
      stream: decoded.stream
    };
    
    next();
  });
};

module.exports = {
  authenticateStudentToken,
  optionalStudentAuth
};