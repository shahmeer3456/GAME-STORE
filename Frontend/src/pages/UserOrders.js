import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getUserOrders } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import './UserOrders.css';

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view your orders');
      navigate('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await getUserOrders();
        
        // Map database fields to component expectations
        const formattedOrders = (response.orders || []).map(order => ({
          id: order.order_id,
          createdAt: order.order_date,
          status: order.status,
          totalAmount: parseFloat(order.total_amount || 0),
          items: (order.items || []).map(item => ({
            id: item.order_item_id,
            quantity: item.quantity,
            game: {
              id: item.game_id,
              title: item.title,
              imageUrl: item.image_url || '/images/game-placeholder.jpg'
            }
          }))
        }));
        
        setOrders(formattedOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Failed to load your orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const getFilteredOrders = () => {
    if (filter === 'all') {
      return orders;
    }
    return orders.filter(order => order.status.toLowerCase() === filter);
  };

  const getOrderStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'status-processing';
      case 'shipped':
        return 'status-shipped';
      case 'delivered':
        return 'status-delivered';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h1>My Orders</h1>
        
        <div className="order-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Orders
          </button>
          
          <button 
            className={`filter-btn ${filter === 'processing' ? 'active' : ''}`}
            onClick={() => setFilter('processing')}
          >
            Processing
          </button>
          
          <button 
            className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
            onClick={() => setFilter('shipped')}
          >
            Shipped
          </button>
          
          <button 
            className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilter('delivered')}
          >
            Delivered
          </button>
          
          <button 
            className={`filter-btn ${filter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            Cancelled
          </button>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📦</div>
          <h2>No Orders Found</h2>
          <p>You haven't placed any orders yet.</p>
          <Link to="/" className="btn-primary">Browse Games</Link>
        </div>
      ) : (
        <div className="orders-list">
          {getFilteredOrders().length === 0 ? (
            <div className="no-filtered-orders">
              <p>No {filter} orders found.</p>
            </div>
          ) : (
            getFilteredOrders().map(order => (
              <div className="order-card" key={order.id}>
                <div className="order-header">
                  <div className="order-date">
                    <span className="label">Order Date:</span>
                    <span className="value">{formatDate(order.createdAt)}</span>
                  </div>
                  
                  <div className="order-number">
                    <span className="label">Order #:</span>
                    <span className="value">{order.id}</span>
                  </div>
                  
                  <div className={`order-status ${getOrderStatusClass(order.status)}`}>
                    {order.status}
                  </div>
                </div>
                
                <div className="order-items">
                  {order.items.slice(0, 3).map(item => (
                    <div className="order-item" key={item.id}>
                      <div className="item-image">
                        <img src={item.game.imageUrl} alt={item.game.title} />
                      </div>
                      
                      <div className="item-details">
                        <span className="item-title">{item.game.title}</span>
                        <span className="item-quantity">Qty: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                  
                  {order.items.length > 3 && (
                    <div className="more-items">
                      +{order.items.length - 3} more items
                    </div>
                  )}
                </div>
                
                <div className="order-footer">
                  <div className="order-total">
                    <span className="label">Total:</span>
                    <span className="value">${order.totalAmount.toFixed(2)}</span>
                  </div>
                  
                  <Link to={`/orders/${order.id}`} className="view-btn">
                    View Order Details
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserOrders; 