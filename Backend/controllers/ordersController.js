const db = require('../config/db');

// Get user's orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT o.*, p.payment_status, p.payment_method 
      FROM orders o
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.user_id = ?
      ORDER BY o.order_date DESC
    `;
    
    const orders = await db.query(query, [userId]);
    
    // Get order items for each order
    for (const order of orders) {
      const itemsQuery = `
        SELECT oi.*, g.title, g.image_url
        FROM order_items oi
        JOIN games g ON oi.game_id = g.game_id
        WHERE oi.order_id = ?
      `;
      
      order.items = await db.query(itemsQuery, [order.order_id]);
    }
    
    res.status(200).json({ orders });
  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    
    // Check if user has access to this order
    const orderQuery = `
      SELECT o.*, p.payment_id, p.payment_status, p.payment_method, p.amount
      FROM orders o
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.order_id = ? AND (o.user_id = ? OR ? = true)
    `;
    
    const orders = await db.query(orderQuery, [orderId, userId, req.user.role === 'admin']);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orders[0];
    
    // Get order items
    const itemsQuery = `
      SELECT oi.*, g.title, g.image_url
      FROM order_items oi
      JOIN games g ON oi.game_id = g.game_id
      WHERE oi.order_id = ?
    `;
    
    order.items = await db.query(itemsQuery, [orderId]);
    
    res.status(200).json({ order });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { paymentMethod, shippingAddress } = req.body;
    
    if (!paymentMethod) {
      return res.status(400).json({ message: 'Payment method is required' });
    }
    
    // Validate payment method
    const validPaymentMethods = ['Credit/Debit Card', 'PayPal', 'Cash on Delivery'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      console.warn(`Received unexpected payment method: ${paymentMethod}`);
    }
    
    // Validate shipping address
    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address) {
      return res.status(400).json({ message: 'Shipping information is required' });
    }
    
    // Get cart items
    const cartQuery = `
      SELECT c.cart_id, c.game_id, c.quantity, g.price, i.stock_quantity
      FROM cart c
      JOIN games g ON c.game_id = g.game_id
      LEFT JOIN inventory i ON g.game_id = i.game_id
      WHERE c.user_id = ?
    `;
    
    const cartItems = await db.query(cartQuery, [userId]);
    
    if (cartItems.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }
    
    // Check stock availability
    for (const item of cartItems) {
      if (item.stock_quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock available for one or more items`
        });
      }
    }
    
    // Calculate total amount
    const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Convert shipping address to JSON string
    const shippingAddressJSON = JSON.stringify(shippingAddress);
    
    // Start transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Create order with shipping address
      let orderQuery = 'INSERT INTO orders (user_id, total_amount, status, shipping_address) VALUES (?, ?, ?, ?)';
      let orderParams = [userId, totalAmount, 'pending', shippingAddressJSON];
      
      // Execute the query
      const [orderResult] = await connection.execute(orderQuery, orderParams);
      
      const orderId = orderResult.insertId;
      
      // Add order items
      for (const item of cartItems) {
        await connection.execute(
          'INSERT INTO order_items (order_id, game_id, quantity, price_at_purchase) VALUES (?, ?, ?, ?)',
          [orderId, item.game_id, item.quantity, item.price]
        );
        
        // Update inventory (reduce stock)
        await connection.execute(
          'UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE game_id = ?',
          [item.quantity, item.game_id]
        );
      }
      
      // Create payment record
      await connection.execute(
        'INSERT INTO payments (order_id, payment_status, payment_method, amount) VALUES (?, ?, ?, ?)',
        [orderId, 'pending', paymentMethod, totalAmount]
      );
      
      // Clear cart
      await connection.execute('DELETE FROM cart WHERE user_id = ?', [userId]);
      
      // Commit transaction
      await connection.commit();
      
      res.status(201).json({
        message: 'Order created successfully',
        orderId,
        totalAmount: parseFloat(totalAmount),
        shippingAddress,
        paymentMethod,
        status: 'pending',
        orderDate: new Date().toISOString()
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      
      console.error('Transaction error details:', error);
      
      // Return more specific error information
      if (error.code === 'ER_NO_REFERENCED_ROW') {
        throw new Error('Referenced item not found: ' + error.message);
      } else if (error.code === 'ER_BAD_FIELD_ERROR') {
        throw new Error('Database schema error: ' + error.message);
      } else {
        throw error;
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      message: 'Error creating order: ' + (error.message || 'Unknown error'),
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Process payment for an order
exports.processPayment = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;
    
    // Check if order exists and belongs to user
    const orderQuery = `
      SELECT o.*, p.payment_id, p.payment_status
      FROM orders o
      LEFT JOIN payments p ON o.order_id = p.order_id
      WHERE o.order_id = ? AND o.user_id = ?
    `;
    
    const orders = await db.query(orderQuery, [orderId, userId]);
    
    if (orders.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const order = orders[0];
    
    if (order.payment_status === 'completed') {
      return res.status(400).json({ message: 'Payment already completed' });
    }
    
    // Simulate payment processing
    // In a real application, this would integrate with a payment gateway
    
    // Update payment status
    await db.query(
      'UPDATE payments SET payment_status = ? WHERE order_id = ?',
      ['completed', orderId]
    );
    
    // Update order status
    await db.query(
      'UPDATE orders SET status = ? WHERE order_id = ?',
      ['processing', orderId]
    );
    
    res.status(200).json({ message: 'Payment processed successfully' });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 