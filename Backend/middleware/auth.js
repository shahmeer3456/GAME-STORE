const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../config/db');

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-access-token'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Check if user exists in database
    const user = await db.query('SELECT user_id, username, email, role FROM users WHERE user_id = ?', [decoded.id]);
    
    if (!user || user.length === 0) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    // Add user info to request
    req.user = {
      id: user[0].user_id,
      username: user[0].username,
      email: user[0].email,
      role: user[0].role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};

// Middleware to check if user has admin role
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Require Admin Role!' });
  }
};

// Middleware to check if user is the owner or an admin
const isOwnerOrAdmin = (req, res, next) => {
  const userId = parseInt(req.params.userId || req.body.userId);
  
  if (!userId) {
    return next();
  }
  
  if (req.user && (req.user.id === userId || req.user.role === 'admin')) {
    next();
  } else {
    res.status(403).json({ message: 'Unauthorized' });
  }
};

module.exports = {
  verifyToken,
  isAdmin,
  isOwnerOrAdmin
}; 