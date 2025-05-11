import api from './api';

const API_URL = '/api/auth';

// Set auth token for API requests
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

// Refresh token to verify it's still valid
export const refreshToken = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw 'No token found';
    }
    
    // Use verify-token endpoint instead of refresh-token since we aren't
    // implementing refresh tokens, just verifying the existing token
    const response = await api.post(`${API_URL}/verify-token`, { token });
    return response.data.user;
  } catch (error) {
    throw error.response?.data?.message || 'Session expired';
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await api.post(`${API_URL}/login`, { email, password });
    const { token, user } = response.data;
    
    // Set token to localStorage
    localStorage.setItem('token', token);
    
    // Return both token and user for the frontend
    return { token, user };
  } catch (error) {
    if (error.message === 'Network Error') {
      throw 'Cannot connect to server. Please check your internet connection and try again.';
    }
    throw error.response?.data?.message || 'Login failed';
  }
};

// Register user
export const register = async (username, email, password) => {
  try {
    const response = await api.post(`${API_URL}/register`, { username, email, password });
    const { token, user } = response.data;
    
    // Set token to localStorage
    localStorage.setItem('token', token);
    
    return response.data;
  } catch (error) {
    if (error.message === 'Network Error') {
      throw new Error('Cannot connect to server. Please check your internet connection and try again.');
    }
    throw error;
  }
};

// Logout user
export const logout = () => {
  // Remove token from localStorage
  localStorage.removeItem('token');
};

// Get user profile
export const getProfile = async () => {
  try {
    const response = await api.get(`${API_URL}/profile`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch profile';
  }
};

// Update user profile
export const updateProfile = async (profileData) => {
  try {
    const response = await api.put(`${API_URL}/profile`, profileData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update profile';
  }
};

// Change password
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put(`${API_URL}/change-password`, {
      currentPassword,
      newPassword
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to change password';
  }
}; 