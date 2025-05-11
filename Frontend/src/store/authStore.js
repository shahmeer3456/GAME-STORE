import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthToken } from '../services/authService';

// Initialize auth headers from localStorage on app load
const token = localStorage.getItem('token');
if (token) {
  setAuthToken(token);
}

// Auth store with persistence
export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: !!token,
      user: null,
      loading: true,
      
      // Set authenticated user
      setUser: (user) => set({ isAuthenticated: true, user, loading: false }),
      
      // Set token
      setToken: (token) => {
        localStorage.setItem('token', token);
        setAuthToken(token);
      },
      
      // Set loading state
      setLoading: (loading) => set({ loading }),
      
      // Logout - clear user data
      logout: () => {
        localStorage.removeItem('token');
        setAuthToken(null);
        set({ isAuthenticated: false, user: null });
      },
      
      // Clear errors
      clearErrors: () => set({ error: null })
    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      getStorage: () => localStorage, // storage provider
      partialize: (state) => ({ isAuthenticated: state.isAuthenticated, user: state.user }),
    }
  )
); 