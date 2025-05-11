/**
 * Utility functions for data formatting across controllers
 */

/**
 * Format numeric values like prices from database to JavaScript numbers
 * @param {Array} items - Array of items that contain price fields
 * @param {Object} options - Configuration options
 * @returns {Array} - Formatted items with proper number types
 */
exports.formatPrices = (items, options = {}) => {
  const { priceField = 'price', discountField = 'discount' } = options;
  
  return items.map(item => {
    const formattedItem = { ...item };
    
    // Format price if it exists
    if (priceField in item) {
      formattedItem[priceField] = parseFloat(item[priceField] || 0);
    }
    
    // Format discount if it exists
    if (discountField in item) {
      formattedItem[discountField] = parseFloat(item[discountField] || 0);
    }
    
    return formattedItem;
  });
};

/**
 * Format dates from database to ISO strings
 * @param {Array} items - Array of items that contain date fields
 * @param {Array} dateFields - Names of date fields to format
 * @returns {Array} - Formatted items with proper date strings
 */
exports.formatDates = (items, dateFields = ['created_at', 'updated_at']) => {
  return items.map(item => {
    const formattedItem = { ...item };
    
    dateFields.forEach(field => {
      if (field in item && item[field]) {
        try {
          const date = new Date(item[field]);
          if (!isNaN(date.getTime())) {
            formattedItem[field] = date.toISOString();
          }
        } catch (e) {
          console.error(`Invalid date conversion for field ${field}:`, e);
        }
      }
    });
    
    return formattedItem;
  });
};

/**
 * Get full image URL with fallback
 * @param {string} imagePath - Relative path to image
 * @param {string} baseUrl - Base URL for API
 * @param {string} fallbackImage - Fallback image path
 * @returns {string} - Complete image URL
 */
exports.getImageUrl = (imagePath, baseUrl = '', fallbackImage = '/images/placeholder.jpg') => {
  if (!imagePath) {
    return fallbackImage;
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  return `${baseUrl}/uploads/${imagePath}`;
}; 