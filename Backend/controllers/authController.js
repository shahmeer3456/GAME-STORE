const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const config = require('../config/config');

// Register a new user
exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  // Validate input
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please provide username, email and password' });
  }

  try {
    // Check if username or email already exists
    const existingUser = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );

    // Generate JWT token
    const token = jwt.sign({ id: result.insertId }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: result.insertId,
        username,
        email,
        role: 'customer'
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ message: 'Please provide email and password' });
  }

  try {
    // Find user by email
    const users = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.user_id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    // Return user data and token
    res.status(200).json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  res.status(200).json({ user: req.user });
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    
    // Find user
    const users = await db.query('SELECT * FROM users WHERE user_id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];

    // Generate new tokens
    const newAccessToken = jwt.sign({ id: user.user_id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });

    res.status(200).json({
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

// Logout user
exports.logout = async (req, res) => {
  // Since we're using JWT, we don't need server-side logout
  // The client should remove the token
  res.status(200).json({ message: 'Logout successful' });
};

// Get user profile
exports.getUserProfile = async (req, res) => {
  try {
    // User data should be available from the auth middleware
    const userId = req.user.id;
    
    // Get user details from database with more comprehensive fields
    const query = `
      SELECT u.user_id, u.username, u.email, u.role, u.created_at,
             ud.phone_number as phoneNumber, ud.address, ud.city, ud.state, ud.zip_code as zipCode, ud.country
      FROM users u
      LEFT JOIN user_details ud ON u.user_id = ud.user_id
      WHERE u.user_id = ?
    `;
    
    const users = await db.query(query, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user orders
    const orders = await db.query(
      'SELECT order_id, total_amount, status, order_date FROM orders WHERE user_id = ? ORDER BY order_date DESC LIMIT 5',
      [userId]
    );

    // Format the user data to combine core and detail information
    const userData = {
      id: users[0].user_id,
      username: users[0].username,
      email: users[0].email,
      role: users[0].role,
      phoneNumber: users[0].phoneNumber || '',
      address: users[0].address || '',
      city: users[0].city || '',
      state: users[0].state || '',
      zipCode: users[0].zipCode || '',
      country: users[0].country || 'United States',
      created_at: users[0].created_at
    };

    res.status(200).json({
      user: userData,
      recentOrders: orders
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update user profile
exports.updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      name, email, phoneNumber, address, city, state, zipCode, country,
      currentPassword, newPassword 
    } = req.body;
    
    // Get current user data
    const users = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Start transaction
    const connection = await db.pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Prepare user table update fields
      const userUpdateFields = {};
      if (name) userUpdateFields.username = name;
      if (email) userUpdateFields.email = email;
      
      // If password change is requested
      if (currentPassword && newPassword) {
        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        
        if (!isPasswordValid) {
          return res.status(401).json({ message: 'Current password is incorrect' });
        }
        
        // Hash new password
        const salt = await bcrypt.genSalt(10);
        userUpdateFields.password = await bcrypt.hash(newPassword, salt);
      }
      
      // Update user table if needed
      if (Object.keys(userUpdateFields).length > 0) {
        const fields = Object.keys(userUpdateFields).map(field => `${field} = ?`).join(', ');
        const values = Object.values(userUpdateFields);
        values.push(userId);
        
        await connection.execute(`UPDATE users SET ${fields} WHERE user_id = ?`, values);
      }
      
      // Check if user_details record exists
      const userDetails = await connection.execute(
        'SELECT * FROM user_details WHERE user_id = ?', 
        [userId]
      );
      
      // Prepare user_details fields
      const detailFields = {
        phone_number: phoneNumber,
        address,
        city,
        state,
        zip_code: zipCode,
        country
      };
      
      // Filter out undefined fields
      const filteredDetailFields = Object.fromEntries(
        Object.entries(detailFields).filter(([_, value]) => value !== undefined)
      );
      
      // Only proceed if there are fields to update
      if (Object.keys(filteredDetailFields).length > 0) {
        if (userDetails[0].length === 0) {
          // Insert new user_details record
          const detailsFields = ['user_id', ...Object.keys(filteredDetailFields)];
          const placeholders = detailsFields.map(() => '?').join(', ');
          const detailsValues = [userId, ...Object.values(filteredDetailFields)];
          
          await connection.execute(
            `INSERT INTO user_details (${detailsFields.join(', ')}) VALUES (${placeholders})`,
            detailsValues
          );
        } else {
          // Update existing user_details record
          const updateFields = Object.keys(filteredDetailFields).map(field => `${field} = ?`).join(', ');
          const updateValues = [...Object.values(filteredDetailFields), userId];
          
          await connection.execute(
            `UPDATE user_details SET ${updateFields} WHERE user_id = ?`,
            updateValues
          );
        }
      }
      
      await connection.commit();
      
      // Get updated profile data
      const userData = {
        id: user.user_id,
        username: userUpdateFields.username || user.username,
        email: userUpdateFields.email || user.email,
        role: user.role,
        // Include updated detail fields
        phoneNumber,
        address,
        city,
        state,
        zipCode,
        country
      };
      
      res.status(200).json({ 
        message: 'Profile updated successfully',
        user: userData
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

// Verify token
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Find user
    const users = await db.query('SELECT user_id, username, email, role FROM users WHERE user_id = ?', [decoded.id]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    res.status(200).json({
      valid: true,
      user: {
        id: user.user_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }
    
    // Get user data
    const users = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await db.query('UPDATE users SET password = ? WHERE user_id = ?', [hashedPassword, userId]);
    
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
}; 