import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrderById } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import './OrderDetails.css';

const OrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view order details');
      navigate('/login');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(id);
        
        // Ensure the user owns this order (or is admin)
        if (user.role !== 'admin' && orderData.userId !== user.id) {
          toast.error('You do not have permission to view this order');
          navigate('/profile');
          return;
        }
        
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/profile');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-details-container">
        <div className="order-error">
          <h2>Order Not Found</h2>
          <p>We couldn't find the order you're looking for.</p>
          <Link to="/profile" className="btn-primary">Back to Profile</Link>
        </div>
      </div>
    );
  }

  const getStatusClass = () => {
    switch (order.status) {
      case 'Processing':
        return 'status-processing';
      case 'Shipped':
        return 'status-shipped';
      case 'Delivered':
        return 'status-delivered';
      case 'Cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  return (
    <div className="order-details-container">
      <div className="order-details-header">
        <h1>Order Details</h1>
        <div className="order-meta">
          <div className="order-id">Order #{order.id}</div>
          <div className={`order-status ${getStatusClass()}`}>
            {order.status}
          </div>
        </div>
      </div>
      
      <div className="order-grid">
        <div className="order-items-section">
          <div className="order-section-card">
            <h2>Order Items</h2>
            
            <div className="order-items-list">
              {order.items.map(item => (
                <div className="order-details-item" key={item.id}>
                  <div className="item-image">
                    <img src={item.game.imageUrl} alt={item.game.title} />
                  </div>
                  
                  <div className="item-info">
                    <h3>{item.game.title}</h3>
                    <p className="item-platform">{item.game.platform}</p>
                    <div className="item-price-row">
                      <span className="item-price">${parseFloat(item.price || 0).toFixed(2)}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                  </div>
                  
                  <div className="item-total">
                    ${(parseFloat(item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="order-section-card">
            <h2>Shipping Information</h2>
            <div className="shipping-address">
              <p className="shipping-name">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.address}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </div>
        </div>
        
        <div className="order-summary-section">
          <div className="order-section-card">
            <h2>Order Summary</h2>
            
            <div className="order-info-grid">
              <div className="info-row">
                <span className="info-label">Order Date</span>
                <span className="info-value">
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Payment Method</span>
                <span className="info-value">{order.paymentMethod}</span>
              </div>
              
              {order.trackingNumber && (
                <div className="info-row">
                  <span className="info-label">Tracking Number</span>
                  <span className="info-value">{order.trackingNumber}</span>
                </div>
              )}
              
              {order.estimatedDelivery && (
                <div className="info-row">
                  <span className="info-label">Estimated Delivery</span>
                  <span className="info-value">
                    {new Date(order.estimatedDelivery).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
            
            <div className="order-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${(order.totalAmount / 1.1).toFixed(2)}</span>
              </div>
              
              <div className="total-row">
                <span>Tax</span>
                <span>${(order.totalAmount - (order.totalAmount / 1.1)).toFixed(2)}</span>
              </div>
              
              <div className="total-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              
              <div className="total-row total">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="order-actions">
            <Link to="/orders" className="btn-secondary">
              Back to Orders
            </Link>
            
            {order.status === 'Processing' && (
              <button className="btn-danger">
                Cancel Order
              </button>
            )}
            
            <Link to="/" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails; 