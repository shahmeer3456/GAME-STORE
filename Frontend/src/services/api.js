import axios from 'axios';

// Use environment variable if available, otherwise fall back to relative path
const baseURL = process.env.NODE_ENV === 'production' 
  ? process.env.REACT_APP_API_URL 
  : '/api';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to include the token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error statuses
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data);
      
      // Handle unauthorized errors (token expired)
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // Redirect to login page if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('No response received:', error.request);
    } else {
      // Error in setting up request
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 