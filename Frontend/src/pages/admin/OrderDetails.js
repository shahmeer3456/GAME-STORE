import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuthStore } from '../../store/authStore';
import { updateOrderStatus } from '../../services/adminService';
import '../../admin/Admin.css';

const AdminOrderDetails = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  // Helper function to log the data structure and help with debugging
  const logOrderStructure = (orderData) => {
    console.log('Order data structure:', JSON.stringify({
      id: orderData.id,
      createdAt: orderData.createdAt,
      status: orderData.status,
      totalAmount: orderData.totalAmount,
      paymentMethod: orderData.paymentMethod,
      paymentStatus: orderData.paymentStatus,
      customer: orderData.customer,
      items: orderData.items ? `${orderData.items.length} items` : 'No items',
      shippingAddress: orderData.shippingAddress
    }, null, 2));
  };

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (!isAuthenticated || (user && user.role !== 'admin')) {
      toast.error('You do not have permission to view this page');
      navigate('/');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        // Since we don't have a specific admin get order by ID endpoint, let's use what the
        // orders list already loaded and fetch from localStorage
        const cachedOrders = localStorage.getItem('adminOrders');
        if (cachedOrders) {
          const orders = JSON.parse(cachedOrders);
          const foundOrder = orders.find(o => o.id === parseInt(id) || o.id === id);
          if (foundOrder) {
            // Log order structure to help with debugging
            logOrderStructure(foundOrder);
            setOrder(foundOrder);
            setLoading(false);
            return;
          }
        }
        
        // If we can't find it, go back to orders list
        toast.error('Order not found. Please try again from the orders list.');
        navigate('/admin/orders');
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/admin/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id, isAuthenticated, user, navigate]);

  const handleStatusChange = async (newStatus) => {
    if (!id || !newStatus) {
      toast.error('Invalid order ID or status');
      return;
    }
    
    try {
      await updateOrderStatus(id, newStatus);
      
      setOrder((prevOrder) => ({
        ...prevOrder,
        status: newStatus
      }));
      
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(typeof error === 'string' ? error : 'Failed to update order status');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="admin-container">
        <div className="admin-header">
          <h1>Order Not Found</h1>
        </div>
        <div className="admin-content">
          <p>We couldn't find the order you're looking for.</p>
          <Link to="/admin/orders" className="admin-btn">Back to Orders</Link>
        </div>
      </div>
    );
  }

  const getStatusClassName = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

  // Format date properly with fallback
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'N/A';
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Order Details</h1>
        <div className="admin-header-actions">
          <Link to="/admin/orders" className="admin-btn secondary">
            <i className="fas fa-arrow-left"></i> Back to Orders
          </Link>
        </div>
      </div>

      <div className="admin-content">
        <div className="order-header-card">
          <div className="order-header">
            <div>
              <h2>Order #{order.id}</h2>
              <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
            </div>
            <div className="order-status-section">
              <span className={`status-badge ${getStatusClassName(order.status)}`}>
                {order.status || 'pending'}
              </span>
              <div className="status-update">
                <select
                  value={order.status || 'pending'}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button className="update-btn" onClick={() => handleStatusChange(order.status)}>
                  Update Status
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-panels">
          <div className="admin-panel">
            <div className="admin-card">
              <h3>Customer Information</h3>
              <div className="customer-info">
                <p>
                  <strong>Name:</strong> 
                  <span>{order.customer?.name || 'Unknown'}</span>
                </p>
                <p>
                  <strong>Email:</strong> 
                  <span>{order.customer?.email || 'No email'}</span>
                </p>
                <p>
                  <strong>User ID:</strong> 
                  <span>{order.customer?.id || 'N/A'}</span>
                </p>
                {order.shippingAddress && (
                  <p>
                    <strong>Address:</strong>
                    <span>
                      {order.shippingAddress.address || 'N/A'}, 
                      {order.shippingAddress.city && ` ${order.shippingAddress.city},`}
                      {order.shippingAddress.state && ` ${order.shippingAddress.state}`}
                      {order.shippingAddress.zipCode && ` ${order.shippingAddress.zipCode}`}
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="admin-card">
              <h3>Payment Information</h3>
              <div className="payment-info">
                <p>
                  <strong>Method:</strong> 
                  <span>{order.paymentMethod || 'N/A'}</span>
                </p>
                <p>
                  <strong>Status:</strong> 
                  <span className={`payment-status ${order.paymentStatus === 'completed' ? 'completed' : 'pending'}`}>
                    {order.paymentStatus || 'Pending'}
                  </span>
                </p>
                <p>
                  <strong>Order Date:</strong> 
                  <span>{formatDate(order.createdAt)}</span>
                </p>
                <p>
                  <strong>Total:</strong> 
                  <span className="payment-total">${(order.totalAmount || 0).toFixed(2)}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="admin-panel">
            <div className="admin-card">
              <h3>Order Items ({order.items?.length || 0})</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items && order.items.length > 0) ? (
                      order.items.map((item, index) => (
                        <tr key={item.id || index}>
                          <td>
                            <div className="product-cell">
                              {item.imageUrl && (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.title} 
                                  className="product-thumbnail" 
                                />
                              )}
                              <div>
                                <div className="product-title">{item.title || 'Unknown Product'}</div>
                                <div className="product-id">ID: {item.gameId || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td>${(item.price || 0).toFixed(2)}</td>
                          <td>{item.quantity || 1}</td>
                          <td>${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="no-data">No items found</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="3" className="order-total-label">Total Amount:</td>
                      <td className="order-total-value">${(order.totalAmount || 0).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetails; 