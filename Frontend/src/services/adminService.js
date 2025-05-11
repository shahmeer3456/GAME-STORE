import api from './api';

const API_URL = '/api/admin';

// Get admin dashboard stats
export const getAdminStats = async () => {
  try {
    const response = await api.get(`${API_URL}/dashboard`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch admin stats';
  }
};

// Get all users
export const getUsers = async () => {
  try {
    const response = await api.get(`${API_URL}/users`);
    return response.data.users;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch users';
  }
};

// Get user by ID
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch user details';
  }
};

// Update user
export const updateUser = async (userId, userData) => {
  try {
    const response = await api.put(`${API_URL}/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update user';
  }
};

// Delete user
export const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`${API_URL}/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete user';
  }
};

// Get all orders
export const getAllOrders = async (page = 1, limit = 10, filters = {}) => {
  try {
    const { status, startDate, endDate } = filters;
    
    const params = { page, limit };
    
    if (status && status !== 'all') {
      params.status = status;
    }
    
    if (startDate) {
      params.startDate = startDate;
    }
    
    if (endDate) {
      params.endDate = endDate;
    }
    
    console.log('Fetching orders with params:', params);
    const response = await api.get(`${API_URL}/orders`, { params });
    console.log('Orders response:', response.data);
    
    // Make sure orders is always an array
    if (response.data && !Array.isArray(response.data.orders)) {
      console.warn('Orders response is not an array:', response.data.orders);
      response.data.orders = [];
    }
    
    return response.data;
  } catch (error) {
    console.error('Error in getAllOrders:', error);
    throw error.response?.data?.message || 'Failed to fetch orders';
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    console.log(`Updating order #${orderId} status to: ${status}`);
    const response = await api.put(`${API_URL}/orders/${orderId}/status`, { status });
    console.log('Update status response:', response.data);
    
    return {
      success: true,
      message: response.data.message,
      orderId: response.data.orderId,
      status: response.data.status
    };
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error.response?.data?.message || 'Failed to update order status';
  }
};

// Get all games
export const getGames = async (page = 1, limit = 10, filter = 'all') => {
  try {
    const params = { page, limit };
    if (filter !== 'all') {
      params.filter = filter;
    }
    
    const response = await api.get(`${API_URL}/games`, { params });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch games';
  }
};

// Add a new game
export const addGame = async (gameData) => {
  try {
    const formData = new FormData();
    Object.keys(gameData).forEach(key => {
      if (key === 'image' && gameData[key]) {
        formData.append('image', gameData[key]);
      } else if (gameData[key] !== null && gameData[key] !== undefined) {
        formData.append(key, gameData[key]);
      }
    });
    
    const response = await api.post(`${API_URL}/games`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add game';
  }
};

// Update a game
export const updateGame = async (gameId, gameData) => {
  try {
    const formData = new FormData();
    Object.keys(gameData).forEach(key => {
      if (key === 'image' && gameData[key]) {
        formData.append('image', gameData[key]);
      } else if (gameData[key] !== null && gameData[key] !== undefined) {
        formData.append(key, gameData[key]);
      }
    });
    
    const response = await api.put(`${API_URL}/games/${gameId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update game';
  }
};

// Delete a game
export const deleteGame = async (gameId) => {
  try {
    const response = await api.delete(`${API_URL}/games/${gameId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete game';
  }
};

// Get game by ID (for editing)
export const getGameById = async (gameId) => {
  try {
    // We can use the public games API endpoint
    const response = await api.get(`/api/games/${gameId}`);
    return response.data.game;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch game details';
  }
};

// Game management functions
export const createGame = async (gameData) => {
  try {
    const response = await api.post(`${API_URL}/games`, gameData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create game';
  }
}; 