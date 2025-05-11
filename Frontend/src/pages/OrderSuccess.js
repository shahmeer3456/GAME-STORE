import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getOrderById } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extract order ID from URL query params
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('id');
  const orderTotal = queryParams.get('total');
  const orderDate = queryParams.get('date');
  const orderStatus = queryParams.get('status');
  const paymentMethod = queryParams.get('paymentMethod');

  useEffect(() => {
    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to view order details');
      navigate('/login');
      return;
    }
    
    // Redirect if no order ID
    if (!orderId) {
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await getOrderById(orderId);
        
        // Format the order data with proper structure and defaults for missing fields
        const orderData = response.order || {};
        
        // Format the order with all necessary fields and proper structure
        const formattedOrder = {
          id: orderData.order_id || orderId,
          createdAt: orderData.order_date || orderDate || new Date().toISOString(),
          status: orderData.status || orderStatus || 'pending',
          totalAmount: parseFloat(orderData.total_amount || orderTotal || 0),
          paymentMethod: orderData.payment_method || paymentMethod || 'Credit/Debit Card',
          shippingAddress: orderData.shipping_address || {
            fullName: 'Customer',
            address: 'Address',
            city: 'City',
            state: 'State',
            zipCode: '00000',
            country: 'Country'
          },
          // Format items with consistent structure
          items: Array.isArray(orderData.items) ? orderData.items.map(item => ({
            id: item.order_item_id,
            quantity: item.quantity || 1,
            price: parseFloat(item.price_at_purchase || 0),
            game: {
              id: item.game_id,
              title: item.title || 'Game Title',
              imageUrl: item.image_url || '/images/game-placeholder.jpg',
              platform: item.platform || 'PC'
            }
          })) : []
        };
        
        setOrder(formattedOrder);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [isAuthenticated, orderId, orderDate, orderStatus, orderTotal, paymentMethod, navigate]);

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
      <div className="order-success-container">
        <div className="order-error">
          <h2>Order Not Found</h2>
          <p>We couldn't find the order you're looking for.</p>
          <Link to="/" className="btn-primary">Return to Home</Link>
        </div>
      </div>
    );
  }

  // Display simplified success message when detailed order info isn't available
  const hasDetailedInfo = Array.isArray(order.items) && order.items.length > 0;

  const getPaymentMethodClass = (method) => {
    if (!method) return 'payment-method-credit';
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('paypal')) return 'payment-method-paypal';
    if (methodLower.includes('cash') || methodLower.includes('delivery')) return 'payment-method-cod';
    return 'payment-method-credit';
  };

  if (!hasDetailedInfo) {
    return (
      <div className="order-success-container">
        <div className="order-success-card">
          <div className="order-success-header">
            <div className="success-icon">✓</div>
            <h1>Order Placed Successfully!</h1>
            <p>Thank you for your purchase. Your order has been received and is being processed.</p>
          </div>
          
          <div className="order-info">
            <div className="order-info-item">
              <span className="label">Order ID:</span>
              <span className="value">{order.id}</span>
            </div>
            
            <div className="order-info-item">
              <span className="label">Date:</span>
              <span className="value">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>
            
            <div className="order-info-item">
              <span className="label">Total:</span>
              <span className="value">${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
            </div>
            
            <div className="order-info-item">
              <span className="label">Status:</span>
              <span className="value">{order.status || 'Processing'}</span>
            </div>
            
            <div className="order-info-item">
              <span className="label">Payment Method:</span>
              <span className={`value payment-method-indicator ${getPaymentMethodClass(order.paymentMethod)}`}>
                {order.paymentMethod}
              </span>
            </div>
          </div>
          
          <div className="order-success-actions">
            <Link to={`/orders/${order.id}`} className="btn-secondary">
              View Order Details
            </Link>
            
            <Link to="/" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="order-success-container">
      <div className="order-success-card">
        <div className="order-success-header">
          <div className="success-icon">✓</div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for your purchase. Your order has been received and is being processed.</p>
        </div>
        
        <div className="order-info">
          <div className="order-info-item">
            <span className="label">Order ID:</span>
            <span className="value">{order.id}</span>
          </div>
          
          <div className="order-info-item">
            <span className="label">Date:</span>
            <span className="value">
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="order-info-item">
            <span className="label">Total:</span>
            <span className="value">${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
          </div>
          
          <div className="order-info-item">
            <span className="label">Payment Method:</span>
            <span className={`value payment-method-indicator ${getPaymentMethodClass(order.paymentMethod)}`}>
              {order.paymentMethod}
            </span>
          </div>
        </div>
        
        <div className="order-items-summary">
          <h2>Order Items</h2>
          
          <div className="order-items-list">
            {order.items.map(item => (
              <div className="success-order-item" key={item.id}>
                <div className="item-image">
                  <img src={item.game.imageUrl} alt={item.game.title} />
                </div>
                
                <div className="item-details">
                  <h3>{item.game.title}</h3>
                  <p className="item-platform">{item.game.platform}</p>
                </div>
                
                <div className="item-quantity">
                  <span>Qty: {item.quantity}</span>
                </div>
                
                <div className="item-price">
                  ${(parseFloat(item.price || 0) * (item.quantity || 1)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          
          <div className="order-totals">
            <div className="total-row">
              <span>Subtotal:</span>
              <span>${(parseFloat(order.totalAmount || 0) / 1.1).toFixed(2)}</span>
            </div>
            
            <div className="total-row">
              <span>Tax:</span>
              <span>${(parseFloat(order.totalAmount || 0) - (parseFloat(order.totalAmount || 0) / 1.1)).toFixed(2)}</span>
            </div>
            
            <div className="total-row total">
              <span>Total:</span>
              <span>${parseFloat(order.totalAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="shipping-info">
          <h2>Shipping Information</h2>
          <p>
            {order.shippingAddress?.fullName || 'Customer'}<br />
            {order.shippingAddress?.address || 'Address'}<br />
            {order.shippingAddress?.city || 'City'}, {order.shippingAddress?.state || 'State'} {order.shippingAddress?.zipCode || 'ZIP'}<br />
            {order.shippingAddress?.country || 'Country'}
          </p>
        </div>
        
        <div className="order-success-actions">
          <Link to={`/orders/${order.id}`} className="btn-secondary">
            View Order Details
          </Link>
          
          <Link to="/" className="btn-primary">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess; 