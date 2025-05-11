const express = require('express');
const ordersController = require('../controllers/ordersController');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// All order routes require authentication
router.use(verifyToken);

// Get user's orders
router.get('/', ordersController.getUserOrders);

// Get order by ID
router.get('/:id', ordersController.getOrderById);

// Create a new order
router.post('/', ordersController.createOrder);

// Process payment for an order
router.post('/:id/payment', ordersController.processPayment);

module.exports = router; 