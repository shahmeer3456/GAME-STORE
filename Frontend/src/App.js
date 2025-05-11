import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import PrivateRoute from './components/layout/PrivateRoute';
import AdminRoute from './components/layout/AdminRoute';
import ApiStatus from './components/ApiStatus';

// Page Components
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import GameDetails from './pages/GameDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import OrderDetails from './pages/OrderDetails';
import UserProfile from './pages/UserProfile';
import UserOrders from './pages/UserOrders';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminGames from './pages/admin/Games';
import AdminOrders from './pages/admin/Orders';
import AdminGameForm from './pages/admin/GameForm';
import AdminOrderDetails from './pages/admin/OrderDetails';
import AdminUsers from './pages/admin/Users';

// Store
import { useAuthStore } from './store/authStore';

// Services
import { refreshToken } from './services/authService';

function App() {
  const { isAuthenticated, user, setUser, setToken, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [showApiStatus, setShowApiStatus] = useState(false);

  // Check for token and load user
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          // Refresh token to verify it's still valid
          const userData = await refreshToken();
          setUser(userData);
          setToken(token);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        // If token is invalid, clear it from localStorage
        localStorage.removeItem('token');
        logout();
        toast.error('Session expired. Please login again.');
        
        // Show API status when authentication fails
        setShowApiStatus(true);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, [setUser, setToken, logout]);

  if (loading) {
    return (
      <div className="loader">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="container">
        {showApiStatus && (
          <div className="api-status-container">
            <ApiStatus showDetails={true} />
            <button 
              className="dismiss-btn" 
              onClick={() => setShowApiStatus(false)}
              aria-label="Dismiss API status"
            >
              ×
            </button>
          </div>
        )}
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/" />} />
          <Route path="/games/:id" element={<GameDetails />} />
          <Route path="/cart" element={<Cart />} />

          {/* Protected Routes */}
          <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
          <Route path="/order-success" element={<PrivateRoute><OrderSuccess /></PrivateRoute>} />
          <Route path="/orders/:id" element={<PrivateRoute><OrderDetails /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><UserOrders /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/games" element={<AdminRoute><AdminGames /></AdminRoute>} />
          <Route path="/admin/games/add" element={<AdminRoute><AdminGameForm /></AdminRoute>} />
          <Route path="/admin/games/edit/:id" element={<AdminRoute><AdminGameForm /></AdminRoute>} />
          <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/orders/:id" element={<AdminRoute><AdminOrderDetails /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default App; 