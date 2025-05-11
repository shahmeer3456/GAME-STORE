import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../store/authStore';
import { getAdminStats } from '../services/adminService';
import './Admin.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    topSellingGames: []
  });
  
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is authenticated and is an admin
    if (!isAuthenticated) {
      toast.error('Please login to access admin panel');
      navigate('/login');
      return;
    }
    
    if (user && user.role !== 'admin') {
      toast.error('You do not have permission to access this page');
      navigate('/');
      return;
    }
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        const adminStats = await getAdminStats();
        setStats(adminStats);
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        toast.error('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, [isAuthenticated, user, navigate]);
  
  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }
  
  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-user">
          <span>Welcome, {user?.name}</span>
        </div>
      </div>
      
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users-icon">👥</div>
          <div className="stat-data">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon games-icon">🎮</div>
          <div className="stat-data">
            <h3>Games Listed</h3>
            <div className="stat-value">{stats.totalGames}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon orders-icon">📦</div>
          <div className="stat-data">
            <h3>Total Orders</h3>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
        </div>
        
        <div className="admin-stat-card">
          <div className="stat-icon revenue-icon">💰</div>
          <div className="stat-data">
            <h3>Total Revenue</h3>
            <div className="stat-value">${stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      </div>
      
      <div className="admin-sections-grid">
        <div className="admin-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="view-all-link">View All</Link>
          </div>
          
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.length > 0 ? (
                  stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>{order.customerName}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td>${order.totalAmount.toFixed(2)}</td>
                      <td>
                        <span className={`status-badge status-${order.status.toLowerCase()}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-data">No recent orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="admin-section">
          <div className="section-header">
            <h2>Top Selling Games</h2>
            <Link to="/admin/games" className="view-all-link">Manage Games</Link>
          </div>
          
          <div className="top-games-grid">
            {stats.topSellingGames.length > 0 ? (
              stats.topSellingGames.map(game => (
                <div className="top-game-card" key={game.id}>
                  <div className="top-game-image">
                    <img src={game.imageUrl} alt={game.title} />
                  </div>
                  <div className="top-game-details">
                    <div className="top-game-info">
                      <h3 className="top-game-title">{game.title}</h3>
                      <div className="top-game-meta">
                        <span className="top-game-sales">{game.sales_count} sales</span>
                        <span className="top-game-price">${parseFloat(game.price || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="top-game-sales">
                      <div className="sales-count">{game.salesCount} sales</div>
                      <div className="sales-progress" style={{ width: `${(game.salesCount / Math.max(...stats.topSellingGames.map(g => g.salesCount))) * 100}%` }}></div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-data">No sales data available</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="admin-actions">
        <Link to="/admin/games/new" className="admin-action-btn">
          Add New Game
        </Link>
        <Link to="/admin/users" className="admin-action-btn">
          Manage Users
        </Link>
        <Link to="/admin/orders" className="admin-action-btn">
          View All Orders
        </Link>
      </div>
    </div>
  );
};

export default Dashboard; 