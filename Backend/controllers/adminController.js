const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// Helper function to check if orders table exists
const checkOrdersTableExists = async () => {
  const checkOrdersQuery = "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'orders') as tableExists";
  const tableCheckResult = await db.query(checkOrdersQuery);
  return tableCheckResult[0].tableExists;
};

// Helper function to build orders query with filters
const buildOrdersQuery = (status, startDate, endDate) => {
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
  
  return { query, queryParams };
};

// Helper function to fetch order items
const fetchOrderItems = async (orderIds) => {
  if (!orderIds || orderIds.length === 0) return [];
  
  const placeholders = orderIds.map(() => '?').join(',');
  const itemsQuery = `
    SELECT oi.*, g.title as game_title, g.image_url
    FROM order_items oi
    JOIN games g ON oi.game_id = g.game_id
    WHERE oi.order_id IN (${placeholders})
  `;
  
  return await db.query(itemsQuery, orderIds) || [];
};

// Helper function to format orders response
const formatOrderResponse = (ordersData, orderItems) => {
  return ordersData.map(order => {
    // Ensure order_id is valid
    if (!order.order_id) {
      console.log('Invalid order record:', order);
      return null;
    }
    
    const items = orderItems.filter(item => item && item.order_id === order.order_id);
    
    // Ensure order_date is a valid date
    let createdAt = null;
    try {
      createdAt = order.order_date ? new Date(order.order_date) : null;
      // Check if date is valid
      if (createdAt && isNaN(createdAt.getTime())) {
        createdAt = new Date(); // Fallback to current date if invalid
      }
    } catch (e) {
      console.error('Invalid date conversion:', e);
      createdAt = new Date();
    }
    
    return {
      id: order.order_id,
      createdAt: createdAt ? createdAt.toISOString() : new Date().toISOString(),
      status: order.status || 'pending',
      totalAmount: parseFloat(order.total_amount || 0),
      paymentStatus: order.payment_status || 'pending',
      paymentMethod: order.payment_method || 'N/A',
      customer: {
        name: order.username || 'Unknown Customer',
        email: order.email || 'No email',
        id: order.user_id
      },
      items: items.map(item => ({
        id: item.order_item_id,
        gameId: item.game_id,
        title: item.game_title || 'Unknown Game',
        price: parseFloat(item.price || 0),
        quantity: item.quantity || 1,
        imageUrl: item.image_url ? `/uploads/${item.image_url}` : null
      })) || []
    };
  }).filter(Boolean); // Filter out any null orders
};

// Get all orders (admin) - Refactored to use helper functions
exports.getAllOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    // Check if orders table exists
    const tableExists = await checkOrdersTableExists();
    
    // If orders table doesn't exist or is empty, return empty results
    if (!tableExists) {
      console.log('Orders table does not exist');
      return res.status(200).json({
        orders: [],
        currentPage: 1,
        totalPages: 0,
        totalOrders: 0
      });
    }
    
    // Check if there are any orders
    const countCheck = await db.query("SELECT COUNT(*) as count FROM orders");
    if (countCheck[0].count === 0) {
      console.log('No orders found in database');
      return res.status(200).json({
        orders: [],
        currentPage: 1, 
        totalPages: 0,
        totalOrders: 0
      });
    }
    
    // Build query with filters
    const { query, queryParams } = buildOrdersQuery(status, startDate, endDate);
    
    // Count total orders for pagination
    const countQuery = query.replace('o.*, u.username, u.email, p.payment_status, p.payment_method', 'COUNT(*) as count');
    const countResult = await db.query(countQuery, queryParams);
    const totalOrders = countResult[0].count || 0;
    
    // Add sorting and pagination to the query
    const finalQuery = query + ' ORDER BY o.order_date DESC LIMIT ? OFFSET ?';
    const finalParams = [...queryParams, limit, offset];
    
    console.log('Query:', finalQuery);
    console.log('Params:', finalParams);
    
    // Execute query
    const ordersData = await db.query(finalQuery, finalParams);
    
    console.log('Orders data:', JSON.stringify(ordersData, null, 2));
    
    if (!ordersData || ordersData.length === 0) {
      return res.status(200).json({
        orders: [],
        currentPage: page,
        totalPages: 0,
        totalOrders: 0
      });
    }
    
    // Get order items for each order
    const orderIds = ordersData.map(order => order.order_id).filter(Boolean);
    const orderItems = await fetchOrderItems(orderIds);
    
    // Format the orders with items and customer information
    const formattedOrders = formatOrderResponse(ordersData, orderItems);
    
    const totalPages = Math.ceil(totalOrders / limit) || 1;
    
    res.status(200).json({
      orders: formattedOrders,
      currentPage: page,
      totalPages,
      totalOrders
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // Validate orderId
    if (!orderId || isNaN(parseInt(orderId))) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }
    
    // Validate status
    if (!status || !['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    // Check if order exists
    const orderCheck = await db.query('SELECT order_id FROM orders WHERE order_id = ?', [orderId]);
    if (!orderCheck || orderCheck.length === 0) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update the order status
    await db.query('UPDATE orders SET status = ? WHERE order_id = ?', [status, orderId]);
    
    res.status(200).json({ 
      message: 'Order status updated successfully',
      orderId,
      status
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a new game (admin)
exports.addGame = async (req, res) => {
  try {
    const { title, description, price, genre, platform, release_date, stock_quantity } = req.body;
    
    // Validate input
    if (!title || !description || !price || !genre || !platform) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    let image_url = null;
    if (req.file) {
      image_url = `${req.file.filename}`;
    }
    
    // Start transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert game
      const [gameResult] = await connection.execute(
        'INSERT INTO games (title, description, price, genre, platform, image_url, release_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, description, price, genre, platform, image_url, release_date || null]
      );
      
      const gameId = gameResult.insertId;
      
      // Add inventory record
      await connection.execute(
        'INSERT INTO inventory (game_id, stock_quantity) VALUES (?, ?)',
        [gameId, stock_quantity || 0]
      );
      
      // Commit transaction
      await connection.commit();
      
      res.status(201).json({
        message: 'Game added successfully',
        gameId
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      
      // Delete uploaded image if it exists
      if (req.file) {
        fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
      }
      
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error adding game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a game (admin)
exports.updateGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    const { 
      title, description, price, discount, genre, platform, 
      release_date, stock_quantity, developer, publisher, 
      features, os, processor, memory, graphics, storage 
    } = req.body;
    
    // Check if game exists
    const games = await db.query('SELECT * FROM games WHERE game_id = ?', [gameId]);
    
    if (games.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = games[0];
    let image_url = game.image_url;
    
    // Process new image if uploaded
    if (req.file) {
      // Delete old image if it exists
      if (game.image_url) {
        const oldImagePath = path.join(__dirname, '../uploads', game.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      
      image_url = `${req.file.filename}`;
    }
    
    // Start transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update game with expanded fields
      await connection.execute(
        `UPDATE games SET 
         title = ?, 
         description = ?, 
         price = ?, 
         discount = ?,
         genre = ?, 
         platform = ?, 
         image_url = ?, 
         release_date = ?,
         developer = ?,
         publisher = ?,
         features = ?,
         os = ?,
         processor = ?,
         memory = ?,
         graphics = ?,
         storage = ?
         WHERE game_id = ?`,
        [
          title || game.title,
          description || game.description,
          price || game.price,
          discount !== undefined ? discount : (game.discount || 0),
          genre || game.genre,
          platform || game.platform,
          image_url,
          release_date || game.release_date,
          developer || game.developer,
          publisher || game.publisher,
          features || game.features,
          os || game.os,
          processor || game.processor,
          memory || game.memory,
          graphics || game.graphics,
          storage || game.storage,
          gameId
        ]
      );
      
      // Update inventory if stock quantity provided
      if (stock_quantity !== undefined) {
        // Check if inventory record exists
        const inventory = await connection.execute(
          'SELECT * FROM inventory WHERE game_id = ?',
          [gameId]
        );
        
        if (inventory[0].length === 0) {
          // Create inventory record if it doesn't exist
          await connection.execute(
            'INSERT INTO inventory (game_id, stock_quantity) VALUES (?, ?)',
            [gameId, stock_quantity]
          );
        } else {
          // Update existing inventory record
          await connection.execute(
            'UPDATE inventory SET stock_quantity = ? WHERE game_id = ?',
            [stock_quantity, gameId]
          );
        }
      }
      
      // Commit transaction
      await connection.commit();
      
      res.status(200).json({ 
        message: 'Game updated successfully',
        gameId: gameId
      });
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      
      // Delete newly uploaded image if it exists
      if (req.file) {
        fs.unlinkSync(path.join(__dirname, '../uploads', req.file.filename));
      }
      
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a game (admin)
exports.deleteGame = async (req, res) => {
  try {
    const gameId = req.params.id;
    
    // Check if game exists
    const games = await db.query('SELECT * FROM games WHERE game_id = ?', [gameId]);
    
    if (games.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = games[0];
    
    // Delete image if it exists
    if (game.image_url) {
      const imagePath = path.join(__dirname, '../uploads', game.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Delete game (cascades to inventory due to foreign key constraint)
    await db.query('DELETE FROM games WHERE game_id = ?', [gameId]);
    
    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (error) {
    console.error('Error deleting game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get dashboard statistics (admin)
exports.getDashboardStats = async (req, res) => {
  try {
    // Total revenue
    const revenueQuery = `
      SELECT SUM(total_amount) as total_revenue
      FROM orders
      WHERE status != 'cancelled'
    `;
    
    const revenueResult = await db.query(revenueQuery);
    const totalRevenue = revenueResult[0].total_revenue || 0;
    
    // Total orders
    const ordersQuery = 'SELECT COUNT(*) as total_orders FROM orders';
    const ordersResult = await db.query(ordersQuery);
    const totalOrders = ordersResult[0].total_orders || 0;
    
    // Total games
    const gamesQuery = 'SELECT COUNT(*) as total_games FROM games';
    const gamesResult = await db.query(gamesQuery);
    const totalGames = gamesResult[0].total_games || 0;
    
    // Total users
    const usersQuery = "SELECT COUNT(*) as total_users FROM users WHERE role = 'customer'";
    const usersResult = await db.query(usersQuery);
    const totalUsers = usersResult[0].total_users || 0;
    
    // Recent orders
    const recentOrdersQuery = `
      SELECT o.*, u.username, p.payment_status
      FROM orders o
      JOIN users u ON o.user_id = u.user_id
      LEFT JOIN payments p ON o.order_id = p.order_id
      ORDER BY o.order_date DESC
      LIMIT 5
    `;
    
    const recentOrders = await db.query(recentOrdersQuery);
    
    // Low stock games
    const lowStockQuery = `
      SELECT g.game_id, g.title, i.stock_quantity
      FROM games g
      JOIN inventory i ON g.game_id = i.game_id
      WHERE i.stock_quantity < 10
      ORDER BY i.stock_quantity ASC
    `;
    
    const lowStockGames = await db.query(lowStockQuery);
    
    res.status(200).json({
      stats: {
        totalRevenue,
        totalOrders,
        totalGames,
        totalUsers
      },
      recentOrders,
      lowStockGames
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT user_id, username, email, role, created_at
      FROM users
      ORDER BY created_at DESC
    `;
    
    const users = await db.query(query);
    
    res.status(200).json({ users });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all games (admin)
exports.getAllGames = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const filter = req.query.filter;
    
    let query = `
      SELECT g.*, i.stock_quantity 
      FROM games g
      LEFT JOIN inventory i ON g.game_id = i.game_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Apply filters if provided
    if (filter === 'inStock') {
      query += ' AND i.stock_quantity > 0';
    } else if (filter === 'outOfStock') {
      query += ' AND (i.stock_quantity = 0 OR i.stock_quantity IS NULL)';
    } else if (filter === 'onSale') {
      query += ' AND g.discount > 0';
    }
    
    // Count total games for pagination
    const countQuery = query.replace('g.*, i.stock_quantity', 'COUNT(*) as count');
    const countResult = await db.query(countQuery, queryParams);
    const totalGames = countResult[0].count;
    
    // Add pagination
    query += ' ORDER BY g.game_id DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    const gamesData = await db.query(query, queryParams);
    
    // Format games data to match frontend expectations
    const games = gamesData.map(game => ({
      id: game.game_id,
      title: game.title,
      description: game.description,
      price: parseFloat(game.price || 0),
      discount: parseFloat(game.discount || 0),
      genre: game.genre,
      platform: game.platform,
      imageUrl: game.image_url ? `/uploads/${game.image_url}` : null,
      release_date: game.release_date,
      developer: game.developer || 'N/A',
      publisher: game.publisher || 'N/A',
      inStock: game.stock_quantity > 0
    }));
    
    const totalPages = Math.ceil(totalGames / limit);
    
    res.status(200).json({
      games,
      currentPage: page,
      totalPages,
      totalGames
    });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a user (admin)
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { username, email, role } = req.body;
    
    // Check if user exists
    const users = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Check if username or email already exists (for another user)
    if (username && username !== user.username) {
      const existingUsername = await db.query('SELECT * FROM users WHERE username = ? AND user_id != ?', [username, userId]);
      if (existingUsername.length > 0) {
        return res.status(400).json({ message: 'Username already exists' });
      }
    }
    
    if (email && email !== user.email) {
      const existingEmail = await db.query('SELECT * FROM users WHERE email = ? AND user_id != ?', [email, userId]);
      if (existingEmail.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }
    }
    
    // Prepare update fields
    const updateFields = {
      username: username || user.username,
      email: email || user.email,
      role: role || user.role
    };
    
    // Update user
    await db.query(
      'UPDATE users SET username = ?, email = ?, role = ? WHERE user_id = ?',
      [updateFields.username, updateFields.email, updateFields.role, userId]
    );
    
    res.status(200).json({ 
      message: 'User updated successfully',
      user: {
        id: userId,
        username: updateFields.username,
        email: updateFields.email,
        role: updateFields.role
      }
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a user (admin)
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const users = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Prevent deleting the last admin user
    if (users[0].role === 'admin') {
      const adminCount = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
      if (adminCount[0].count <= 1) {
        return res.status(400).json({ message: 'Cannot delete the last admin user' });
      }
    }
    
    // Delete user (will cascade delete all related data due to foreign key constraints)
    await db.query('DELETE FROM users WHERE user_id = ?', [userId]);
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 