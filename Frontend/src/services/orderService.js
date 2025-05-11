import api from './api';

const API_URL = '/api/orders';

// Get user orders
export const getUserOrders = async () => {
  try {
    const response = await api.get(API_URL);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch orders';
  }
};

// Get order by ID
export const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`${API_URL}/${orderId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch order details';
  }
};

// Create new order
export const createOrder = async (orderData) => {
  try {
    const response = await api.post(API_URL, orderData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to create order';
  }
};

// Cancel order
export const cancelOrder = async (orderId) => {
  try {
    const response = await api.put(`${API_URL}/${orderId}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to cancel order';
  }
};

// Process payment for an order
export const processPayment = async (orderId) => {
  const response = await api.post(`${API_URL}/${orderId}/payment`);
  return response.data;
}; 