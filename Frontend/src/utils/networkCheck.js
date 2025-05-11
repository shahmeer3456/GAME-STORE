import axios from 'axios';

/**
 * Check if the backend server is reachable
 * @returns {Promise<boolean>} True if server is reachable, false otherwise
 */
export const checkServerConnection = async () => {
  try {
    // Create a new axios instance for this check to avoid base URL issues
    const instance = axios.create({
      baseURL: process.env.NODE_ENV === 'production' 
        ? process.env.REACT_APP_API_URL 
        : 'http://localhost:5000',
      timeout: 5000,
    });
    
    await instance.get('/api');
    return true;
  } catch (error) {
    console.log('Server connection error:', error.message);
    return false;
  }
};

/**
 * Check if internet connection is available
 * @returns {Promise<boolean>} True if internet is connected, false otherwise
 */
export const checkInternetConnection = async () => {
  try {
    // Try to fetch a small external resource
    const instance = axios.create({
      timeout: 5000,
    });
    
    await instance.get('https://www.google.com/favicon.ico');
    return true;
  } catch (error) {
    console.log('Internet connection error:', error.message);
    return false;
  }
}; 