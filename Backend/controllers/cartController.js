const db = require('../config/db');
const { formatPrices } = require('../utils/dataFormatter');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT c.cart_id, c.game_id, c.quantity, g.title, g.price, g.image_url, i.stock_quantity
      FROM cart c
      JOIN games g ON c.game_id = g.game_id
      LEFT JOIN inventory i ON g.game_id = i.game_id
      WHERE c.user_id = ?
    `;
    
    const cartItems = await db.query(query, [userId]);
    
    // Format response with parsed prices using utility function
    const formattedCart = formatPrices(cartItems);
    
    // Calculate total
    const total = formattedCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    res.status(200).json({
      cartItems: formattedCart,
      total: parseFloat(total.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add item to cart
exports.addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gameId, quantity = 1 } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ message: 'Game ID is required' });
    }
    
    // Check if game exists and has stock
    const games = await db.query(
      'SELECT g.*, i.stock_quantity FROM games g LEFT JOIN inventory i ON g.game_id = i.game_id WHERE g.game_id = ?',
      [gameId]
    );
    
    if (games.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = games[0];
    
    if (game.stock_quantity < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    // Check if item is already in cart
    const existingCartItems = await db.query(
      'SELECT * FROM cart WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    );
    
    if (existingCartItems.length > 0) {
      // Update quantity
      const newQuantity = existingCartItems[0].quantity + quantity;
      
      if (game.stock_quantity < newQuantity) {
        return res.status(400).json({ message: 'Not enough stock available' });
      }
      
      await db.query(
        'UPDATE cart SET quantity = ? WHERE cart_id = ?',
        [newQuantity, existingCartItems[0].cart_id]
      );
      
      res.status(200).json({ message: 'Cart updated successfully' });
    } else {
      // Add new item to cart
      await db.query(
        'INSERT INTO cart (user_id, game_id, quantity) VALUES (?, ?, ?)',
        [userId, gameId, quantity]
      );
      
      res.status(201).json({ message: 'Item added to cart successfully' });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update cart item quantity
exports.updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartId = req.params.id;
    const { quantity } = req.body;
    
    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }
    
    // Get cart item
    const cartItems = await db.query(
      'SELECT c.*, g.game_id, i.stock_quantity FROM cart c JOIN games g ON c.game_id = g.game_id LEFT JOIN inventory i ON g.game_id = i.game_id WHERE c.cart_id = ? AND c.user_id = ?',
      [cartId, userId]
    );
    
    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    const cartItem = cartItems[0];
    
    // Check stock
    if (cartItem.stock_quantity < quantity) {
      return res.status(400).json({ message: 'Not enough stock available' });
    }
    
    // Update quantity
    await db.query(
      'UPDATE cart SET quantity = ? WHERE cart_id = ?',
      [quantity, cartId]
    );
    
    res.status(200).json({ message: 'Cart item updated successfully' });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Remove item from cart
exports.removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cartId = req.params.id;
    
    // Check if cart item exists
    const cartItems = await db.query(
      'SELECT * FROM cart WHERE cart_id = ? AND user_id = ?',
      [cartId, userId]
    );
    
    if (cartItems.length === 0) {
      return res.status(404).json({ message: 'Cart item not found' });
    }
    
    // Remove item from cart
    await db.query('DELETE FROM cart WHERE cart_id = ?', [cartId]);
    
    res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Clear cart
exports.clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await db.query('DELETE FROM cart WHERE user_id = ?', [userId]);
    
    res.status(200).json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 