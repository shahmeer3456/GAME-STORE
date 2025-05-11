import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllOrders, updateOrderStatus } from '../../services/adminService';
import '../../admin/Admin.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter, dateRange]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Prepare date filter parameters
      let dateParams = {};
      if (dateRange === 'today') {
        const today = new Date().toISOString().split('T')[0];
        dateParams = { startDate: today, endDate: today };
      } else if (dateRange === 'week') {
        const today = new Date();
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateParams = {
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      } else if (dateRange === 'month') {
        const today = new Date();
        const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        dateParams = {
          startDate: monthAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        };
      }
      
      const response = await getAllOrders(currentPage, 10, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        ...dateParams
      });
      
      // Ensure response.orders is an array before setting state
      const ordersData = Array.isArray(response.orders) ? response.orders : [];
      setOrders(ordersData);
      
      // Save orders to localStorage for the OrderDetails component to use
      try {
        localStorage.setItem('adminOrders', JSON.stringify(ordersData));
      } catch (e) {
        console.warn('Could not save orders to localStorage:', e);
      }
      
      setTotalPages(response.totalPages || 1);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
      setLoading(false);
      setOrders([]); // Reset orders on error
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    if (!orderId || !newStatus) {
      toast.error('Invalid order ID or status');
      return;
    }
    
    try {
      console.log(`Attempting to update order #${orderId} to ${newStatus}`);
      const result = await updateOrderStatus(orderId, newStatus);
      
      // Update local order status
      setOrders(prevOrders => 
        Array.isArray(prevOrders) ? prevOrders.map(order => 
          order && order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ) : []
      );
      
      toast.success(`Order #${orderId} status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(typeof error === 'string' ? error : 'Failed to update order status');
    }
  };

  const getStatusClassName = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  };

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

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.id.toString().includes(searchLower) ||
      (order.customer?.name?.toLowerCase() || '').includes(searchLower) ||
      (order.customer?.email?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (loading && orders.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Order Management</h1>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by order ID, customer name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
        </div>

        <div className="filter-group">
          <div className="filter-dropdown">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="filter-dropdown">
            <select
              value={dateRange}
              onChange={(e) => {
                setDateRange(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length > 0 ? (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id}</td>
                  <td>
                    <div>
                      <div>{order.customer?.name || 'Unknown'}</div>
                      <div className="email-small">{order.customer?.email || 'No email'}</div>
                    </div>
                  </td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>{order.items?.length || 0} items</td>
                  <td>${(order.totalAmount || 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClassName(order.status || 'pending')}`}>
                      {order.status || 'pending'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/orders/${order.id}`} className="action-btn view-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: '4px'}}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        View
                      </Link>
                      
                      <div className="status-dropdown">
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          className="status-select"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  {searchTerm
                    ? 'No orders match your search'
                    : 'No orders found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Orders; 