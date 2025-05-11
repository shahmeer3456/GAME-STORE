import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { login } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { checkServerConnection } from '../utils/networkCheck';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  
  const { isAuthenticated, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get redirect path from location state or default to home page
  const from = location.state?.from?.pathname || '/';
  
  useEffect(() => {
    // If user is already authenticated, redirect them
    if (isAuthenticated) {
      navigate(from);
    }
  }, [isAuthenticated, navigate, from]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const validateForm = () => {
    const { email, password } = formData;
    
    if (!email) {
      toast.error('Email is required');
      return false;
    }
    
    if (!password) {
      toast.error('Password is required');
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Check server connectivity before submitting
      const isServerConnected = await checkServerConnection();
      if (!isServerConnected) {
        toast.error('Cannot connect to server. Please check your network connection.');
        return;
      }
      
      const user = await login(formData.email, formData.password);
      setUser(user);
      
      toast.success('Login successful');
      navigate(from);
    } catch (error) {
      console.error('Login error:', error);
      toast.error(typeof error === 'string' ? error : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Welcome Back</h1>
          <p>Log in to your GameStore account</p>
        </div>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          
          <div className="form-extras">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            
            <Link to="/forgot-password" className="forgot-password">
              Forgot password?
            </Link>
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 