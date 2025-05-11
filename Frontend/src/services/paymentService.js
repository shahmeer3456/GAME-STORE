import api from './api';

const API_URL = '/api/payments';

/**
 * Process a payment for an order
 * @param {string} orderId - The ID of the order to process payment for
 * @param {object} paymentData - Payment details including method and card info if applicable
 * @returns {Promise<object>} - Payment confirmation details
 */
export const processPayment = async (orderId, paymentData) => {
  try {
    const response = await api.post(`${API_URL}/process`, {
      orderId,
      ...paymentData
    });
    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      throw error.response.data.message || 'Payment processing failed';
    }
    throw 'Payment service unavailable';
  }
};

/**
 * Get available payment methods
 * @returns {Promise<Array>} - List of available payment methods
 */
export const getPaymentMethods = async () => {
  try {
    const response = await api.get(`${API_URL}/methods`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch payment methods';
  }
};

/**
 * Get saved payment methods for the current user
 * @returns {Promise<Array>} - List of saved payment methods
 */
export const getSavedPaymentMethods = async () => {
  try {
    const response = await api.get(`${API_URL}/methods/saved`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch saved payment methods';
  }
};

/**
 * Save a payment method for future use
 * @param {object} paymentMethod - Payment method details to save
 * @returns {Promise<object>} - Saved payment method details
 */
export const savePaymentMethod = async (paymentMethod) => {
  try {
    const response = await api.post(`${API_URL}/methods/save`, paymentMethod);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to save payment method';
  }
};

/**
 * Delete a saved payment method
 * @param {string} paymentMethodId - ID of the payment method to delete
 * @returns {Promise<object>} - Confirmation of deletion
 */
export const deleteSavedPaymentMethod = async (paymentMethodId) => {
  try {
    const response = await api.delete(`${API_URL}/methods/${paymentMethodId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to delete payment method';
  }
}; 