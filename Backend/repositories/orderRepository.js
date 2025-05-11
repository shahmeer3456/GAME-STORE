/**
 * Order Repository - Centralizes database operations for orders
 */
const db = require('../config/db');

/**
 * Get all orders with optional filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} - Orders matching criteria
 */
exports.getOrders = async (filters = {}, pagination = {}) => {
  const { status, startDate, endDate, userId } = filters;
  const { page = 1, limit = 10 } = pagination;
  const offset = (page - 1) * limit;
  
  let query = `
    SELECT o.*, u.username, u.email, p.payment_status, p.payment_method
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE 1=1
  `;
  
  const queryParams = [];
  
  // Apply filters if provided
  if (status) {
    query += ' AND o.status = ?';
    queryParams.push(status);
  }
  
  if (userId) {
    query += ' AND o.user_id = ?';
    queryParams.push(userId);
  }
  
  if (startDate && endDate) {
    query += ' AND DATE(o.order_date) BETWEEN ? AND ?';
    queryParams.push(startDate, endDate);
  } else if (startDate) {
    query += ' AND DATE(o.order_date) >= ?';
    queryParams.push(startDate);
  } else if (endDate) {
    query += ' AND DATE(o.order_date) <= ?';
    queryParams.push(endDate);
  }
  
  // Get total count for pagination
  const countQuery = query.replace('o.*, u.username, u.email, p.payment_status, p.payment_method', 'COUNT(*) as count');
  const countResult = await db.query(countQuery, queryParams);
  const totalCount = countResult[0].count || 0;
  
  // Add sorting and pagination
  query += ' ORDER BY o.order_date DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, offset);
  
  const orders = await db.query(query, queryParams);
  
  return {
    orders,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1
    }
  };
};

/**
 * Get an order by ID with related items
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} - Order with items
 */
exports.getOrderById = async (orderId) => {
  // Get order details
  const orderQuery = `
    SELECT o.*, u.username, u.email, p.payment_status, p.payment_method
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
    LEFT JOIN payments p ON o.order_id = p.order_id
    WHERE o.order_id = ?
  `;
  
  const orders = await db.query(orderQuery, [orderId]);
  
  if (orders.length === 0) {
    return null;
  }
  
  // Get order items
  const itemsQuery = `
    SELECT oi.*, g.title as game_title, g.image_url
    FROM order_items oi
    JOIN games g ON oi.game_id = g.game_id
    WHERE oi.order_id = ?
  `;
  
  const items = await db.query(itemsQuery, [orderId]);
  
  return {
    ...orders[0],
    items: items || []
  };
};

/**
 * Create a new order
 * @param {Object} orderData - Order data
 * @returns {Promise<Object>} - Created order
 */
exports.createOrder = async (orderData) => {
  const { userId, totalAmount, status = 'pending', shippingAddress, items } = orderData;
  
  // Start transaction
  const connection = await db.pool.getConnection();
  await connection.beginTransaction();
  
  try {
    // Insert order
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (user_id, total_amount, status) VALUES (?, ?, ?)',
      [userId, totalAmount, status]
    );
    
    const orderId = orderResult.insertId;
    
    // Insert shipping address if provided
    if (shippingAddress) {
      await connection.execute(
        'INSERT INTO shipping_addresses (order_id, full_name, address, city, state, zip_code, country) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          orderId,
          shippingAddress.fullName,
          shippingAddress.address,
          shippingAddress.city,
          shippingAddress.state,
          shippingAddress.zipCode,
          shippingAddress.country
        ]
      );
    }
    
    // Insert order items
    if (items && items.length > 0) {
      for (const item of items) {
        await connection.execute(
          'INSERT INTO order_items (order_id, game_id, quantity, price) VALUES (?, ?, ?, ?)',
          [orderId, item.gameId, item.quantity, item.price]
        );
        
        // Update inventory
        await connection.execute(
          'UPDATE inventory SET stock_quantity = stock_quantity - ? WHERE game_id = ?',
          [item.quantity, item.gameId]
        );
      }
    }
    
    // Commit transaction
    await connection.commit();
    
    return this.getOrderById(orderId);
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * Update order status
 * @param {number} orderId - Order ID
 * @param {string} status - New status
 * @returns {Promise<boolean>} - Success status
 */
exports.updateOrderStatus = async (orderId, status) => {
  // Validate status
  const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    throw new Error('Invalid status');
  }
  
  const result = await db.query(
    'UPDATE orders SET status = ? WHERE order_id = ?',
    [status, orderId]
  );
  
  return result.affectedRows > 0;
}; 