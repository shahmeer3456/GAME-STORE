import api from './api';

// Service to check backend connection and API status
const connectionService = {
  /**
   * Check if the backend API is reachable and running
   * @returns {Promise<Object>} The API status response
   */
  checkApiStatus: async () => {
    try {
      const response = await api.get('/');
      return {
        success: true,
        message: response.data || 'API is running',
        status: response.status
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data || 'Could not connect to API',
        status: error.response?.status || 'Connection error'
      };
    }
  },
  
  /**
   * Get API version and server info
   * @returns {Promise<Object>} Server information
   */
  getServerInfo: async () => {
    try {
      // This assumes you have an endpoint for server info
      const response = await api.get('/api/auth/status');
      return response.data;
    } catch (error) {
      console.error('Failed to get server info:', error);
      throw error;
    }
  }
};

export default connectionService; 