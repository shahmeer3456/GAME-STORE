import api from './api';

const API_URL = '/api/cart';

// Get user cart
export const getCart = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch cart';
  }
};

// Add item to cart
export const addToCart = async (gameId, quantity = 1) => {
  try {
    const response = await api.post(`${API_URL}/add`, { gameId, quantity });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to add item to cart';
  }
};

// Update cart item quantity
export const updateCartItem = async (cartItemId, quantity) => {
  try {
    const response = await api.put(`${API_URL}/${cartItemId}`, { quantity });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to update cart item';
  }
};

// Remove item from cart
export const removeFromCart = async (cartItemId) => {
  try {
    const response = await api.delete(`${API_URL}/${cartItemId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to remove item from cart';
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const response = await api.delete(API_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to clear cart';
  }
}; 