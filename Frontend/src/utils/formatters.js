/**
 * Frontend utility functions for formatting and display
 */

/**
 * Format price to display with 2 decimal places and currency symbol
 * @param {number|string} price - Price to format
 * @param {string} currency - Currency symbol (default: $)
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price, currency = '$') => {
  return `${currency}${parseFloat(price || 0).toFixed(2)}`;
};

/**
 * Format raw price value to number with 2 decimal places
 * @param {number|string} price - Price to format
 * @returns {string} - Formatted price string without currency symbol
 */
export const formatPriceRaw = (price) => {
  return parseFloat(price || 0).toFixed(2);
};

/**
 * Get full image URL with fallback
 * @param {string} imagePath - Relative path to image
 * @param {string} fallbackImage - Fallback image path
 * @returns {string} - Complete image URL
 */
export const getImageUrl = (imagePath, fallbackImage = '/images/game-placeholder.jpg') => {
  const imageBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  if (!imagePath) {
    return fallbackImage;
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${imageBaseUrl}/uploads/${imagePath}`;
};

/**
 * Format date to a user-friendly string
 * @param {string|Date} date - Date to format
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return 'N/A';
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };
  
  try {
    return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(new Date(date));
  } catch (e) {
    console.error('Date formatting error:', e);
    return 'Invalid date';
  }
};

/**
 * Format stock information in a user-friendly way
 * @param {number} quantity - Stock quantity
 * @returns {string} - Formatted stock info message
 */
export const formatStockInfo = (quantity) => {
  if (!quantity || quantity <= 0) return 'Out of Stock';
  if (quantity < 5) return `Only ${quantity} left!`;
  if (quantity < 10) return `${quantity} in stock`;
  return 'In Stock';
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}; 