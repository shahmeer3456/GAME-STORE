const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// Register a new user
router.post('/signup', authController.signup);
// Add register endpoint that uses the same controller for frontend compatibility
router.post('/register', authController.signup);

// Login user
router.post('/login', authController.login);

// Get current user (protected route)
router.get('/me', verifyToken, authController.getCurrentUser);

// Authentication routes
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

// Protected routes - use verifyToken middleware instead of protect
router.get('/profile', verifyToken, authController.getUserProfile);
router.put('/profile', verifyToken, authController.updateUserProfile);
router.put('/change-password', verifyToken, authController.changePassword);

// Token verification route
router.post('/verify-token', authController.verifyToken);

// API status route
router.get('/status', (req, res) => {
    res.json({
        status: 'online',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

module.exports = router; 