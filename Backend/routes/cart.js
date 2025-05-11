const express = require('express');
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All cart routes require authentication
router.use(verifyToken);

// Get user's cart
router.get('/', cartController.getCart);

// Add item to cart
router.post('/add', cartController.addToCart);

// Update cart item quantity
router.put('/:id', cartController.updateCartItem);

// Remove item from cart
router.delete('/:id', cartController.removeFromCart);

// Clear cart
router.delete('/', cartController.clearCart);

module.exports = router; 