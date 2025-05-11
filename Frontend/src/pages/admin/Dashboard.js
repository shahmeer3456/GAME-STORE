import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { getAdminStats } from '../../services/adminService';
import '../../admin/Admin.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGames: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
    lowStockGames: []
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
        const response = await getAdminStats();
        
        // Format the received data
        if (response && response.stats) {
          setStats({
            totalUsers: response.stats.totalUsers || 0,
            totalGames: response.stats.totalGames || 0,
            totalOrders: response.stats.totalOrders || 0,
            totalRevenue: response.stats.totalRevenue || 0,
            recentOrders: response.recentOrders || [],
            lowStockGames: response.lowStockGames || []
          });
        }
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome to the GameStore Admin Panel</p>
      </div>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-icon users-icon">👤</div>
          <div className="stat-data">
            <h3>Total Users</h3>
            <div className="stat-value">{stats.totalUsers}</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-icon games-icon">🎮</div>
          <div className="stat-data">
            <h3>Total Games</h3>
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
            <div className="stat-value">{formatCurrency(stats.totalRevenue)}</div>
          </div>
        </div>
      </div>

      <div className="admin-sections-grid">
        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders" className="view-all-link">View All</Link>
          </div>
          
          {stats.recentOrders.length === 0 ? (
            <div className="no-data-message">No recent orders</div>
          ) : (
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
                  {stats.recentOrders.map(order => (
                    <tr key={order.order_id}>
                      <td>#{order.order_id}</td>
                      <td>{order.username}</td>
                      <td>{formatDate(order.order_date)}</td>
                      <td>{formatCurrency(order.total_amount)}</td>
                      <td>
                        <span className={`status-badge status-${order.status}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="admin-section">
          <div className="admin-section-header">
            <h2>Low Stock Games</h2>
            <Link to="/admin/games" className="view-all-link">View All Games</Link>
          </div>
          
          {stats.lowStockGames.length === 0 ? (
            <div className="no-data-message">No low stock games</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Game</th>
                    <th>Stock</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.lowStockGames.map(game => (
                    <tr key={game.game_id}>
                      <td>{game.title}</td>
                      <td>
                        <span className={`stock-badge ${game.stock_quantity < 5 ? 'critical' : 'low'}`}>
                          {game.stock_quantity}
                        </span>
                      </td>
                      <td>
                        <Link to={`/admin/games/edit/${game.game_id}`} className="action-link">
                          Update Stock
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="admin-section">
        <div className="admin-section-header">
          <h2>Quick Actions</h2>
        </div>
        
        <div className="admin-actions-grid">
          <Link to="/admin/games/add" className="admin-action-card">
            <div className="action-icon">➕</div>
            <h3>Add New Game</h3>
            <p>Add a new game to the store</p>
          </Link>
          
          <Link to="/admin/orders" className="admin-action-card">
            <div className="action-icon">📦</div>
            <h3>Manage Orders</h3>
            <p>Update order status and view details</p>
          </Link>
          
          <Link to="/admin/users" className="admin-action-card">
            <div className="action-icon">👤</div>
            <h3>Manage Users</h3>
            <p>View and manage user accounts</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 