import { create } from 'zustand';
import { getAllGames, getGameById, getGamesByGenre, getGenres, getPlatforms } from '../services/gameService';

export const useGameStore = create((set, get) => ({
  games: [],
  game: null,
  genres: [],
  platforms: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    genre: '',
    platform: '',
    sort: '-release_date' // Default sorting by newest
  },
  
  // Set loading state
  setLoading: (loading) => set({ loading }),
  
  // Set error
  setError: (error) => set({ error }),
  
  // Fetch all games with optional filters
  fetchGames: async (filters = {}) => {
    try {
      set({ loading: true });
      
      // Merge with existing filters
      const updatedFilters = { ...get().filters, ...filters };
      set({ filters: updatedFilters });
      
      const games = await getAllGames(updatedFilters);
      set({ games, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch games',
        loading: false 
      });
    }
  },
  
  // Fetch single game by ID
  fetchGame: async (id) => {
    try {
      set({ loading: true });
      const game = await getGameById(id);
      set({ game, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch game',
        loading: false 
      });
    }
  },
  
  // Fetch games by genre
  fetchGamesByGenre: async (genre) => {
    try {
      set({ loading: true });
      const games = await getGamesByGenre(genre);
      set({ games, loading: false });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch games by genre',
        loading: false 
      });
    }
  },
  
  // Fetch all genres
  fetchGenres: async () => {
    try {
      const genres = await getGenres();
      set({ genres });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch genres' });
    }
  },
  
  // Fetch all platforms
  fetchPlatforms: async () => {
    try {
      const platforms = await getPlatforms();
      set({ platforms });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch platforms' });
    }
  },
  
  // Update filters
  updateFilters: (newFilters) => {
    set(state => ({
      filters: {
        ...state.filters,
        ...newFilters
      }
    }));
  },
  
  // Clear filters
  clearFilters: () => {
    set({
      filters: {
        search: '',
        genre: '',
        platform: '',
        sort: '-release_date'
      }
    });
  }
})); 