import api from './api';

const API_URL = '/api/games';

// Get all games with filtering and pagination
export const getGames = async (params = {}) => {
  try {
    const response = await api.get(API_URL, { params });
    return response.data.games || [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch games';
  }
};

// Alias for getGames to match the import in gameStore
export const getAllGames = getGames;

// Get games by genre
export const getGamesByGenre = async (genre) => {
  try {
    const response = await api.get(`${API_URL}/genre/${genre}`);
    return response.data.games || [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch games by genre';
  }
};

// Get all genres - alias for getGameCategories
export const getGenres = async () => {
  return getGameCategories();
};

// Get all platforms - alias for getGamePlatforms
export const getPlatforms = async () => {
  return getGamePlatforms();
};

// Get game by ID
export const getGameById = async (gameId) => {
  try {
    const response = await api.get(`${API_URL}/${gameId}`);
    return response.data.game;
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch game details';
  }
};

// Search games
export const searchGames = async (searchTerm) => {
  try {
    const response = await api.get(`${API_URL}/search`, { 
      params: { query: searchTerm } 
    });
    return response.data.games || [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to search games';
  }
};

// Get game categories/genres
export const getGameCategories = async () => {
  try {
    const response = await api.get(`${API_URL}/filters/genres`);
    return response.data.genres || [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch game categories';
  }
};

// Get game platforms
export const getGamePlatforms = async () => {
  try {
    const response = await api.get(`${API_URL}/filters/platforms`);
    return response.data.platforms || [];
  } catch (error) {
    throw error.response?.data?.message || 'Failed to fetch game platforms';
  }
}; 