import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { processPayment } from '../services/paymentService';
import { getOrderById } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import './Payment.css';

const Payment = () => {
  const [selectedMethod, setSelectedMethod] = useState('credit_card');
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    savePaymentMethod: false
  });
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const orderId = queryParams.get('orderId');
  
  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Please login to access payment page');
      navigate('/login');
      return;
    }
    
    if (!orderId) {
      toast.error('No order specified for payment');
      navigate('/cart');
      return;
    }
    
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const orderData = await getOrderById(orderId);
        setOrder(orderData);
      } catch (error) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [isAuthenticated, orderId, navigate]);
  
  const handleMethodChange = (method) => {
    setSelectedMethod(method);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentDetails(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const formatCardNumber = (input) => {
    // Remove all non-digit characters
    const digits = input.replace(/\D/g, '');
    
    // Add space after every 4 digits
    const formattedNumber = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    
    return formattedNumber.slice(0, 19); // Limit to 16 digits + 3 spaces
  };
  
  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setPaymentDetails(prev => ({
      ...prev,
      cardNumber: formattedValue
    }));
  };
  
  const validatePaymentDetails = () => {
    if (selectedMethod === 'credit_card') {
      const { cardNumber, cardName, expiryDate, cvv } = paymentDetails;
      
      if (!cardNumber || cardNumber.replace(/\s/g, '').length !== 16) {
        toast.error('Please enter a valid 16-digit card number');
        return false;
      }
      
      if (!cardName) {
        toast.error('Please enter the name on card');
        return false;
      }
      
      if (!expiryDate || !/^\d{2}\/\d{2}$/.test(expiryDate)) {
        toast.error('Please enter a valid expiration date (MM/YY)');
        return false;
      }
      
      if (!cvv || !/^\d{3,4}$/.test(cvv)) {
        toast.error('Please enter a valid CVV code');
        return false;
      }
    }
    
    return true;
  };
  
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentDetails()) {
      return;
    }
    
    try {
      setProcessing(true);
      
      // Process payment
      await processPayment(orderId, {
        paymentMethod: selectedMethod,
        paymentDetails: selectedMethod === 'credit_card' ? paymentDetails : null
      });
      
      // Show success animation
      setSuccess(true);
      
      // Wait for animation to finish before redirecting
      setTimeout(() => {
        navigate(`/order-success?id=${orderId}`);
      }, 3000);
      
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(typeof error === 'string' ? error : 'Payment processing failed. Please try again.');
      setProcessing(false);
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading payment details...</p>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="payment-success-container">
        <div className="success-animation">
          <div className="checkmark-circle">
            <div className="checkmark draw"></div>
          </div>
        </div>
        <h2>Payment Successful!</h2>
        <p>Your order has been confirmed and is being processed.</p>
        <p>You will be redirected to the order confirmation page shortly...</p>
      </div>
    );
  }
  
  if (!order) {
    return (
      <div className="payment-error-container">
        <h2>Order Not Found</h2>
        <p>We couldn't find the order you're trying to pay for.</p>
        <button 
          onClick={() => navigate('/cart')}
          className="btn-primary"
        >
          Return to Cart
        </button>
      </div>
    );
  }
  
  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Complete Your Payment</h1>
        <p>Order #{orderId}</p>
      </div>
      
      <div className="payment-grid">
        <div className="payment-methods-section">
          <div className="payment-section-card">
            <h2>Select Payment Method</h2>
            
            <div className="payment-methods">
              <div 
                className={`payment-method ${selectedMethod === 'credit_card' ? 'selected' : ''}`}
                onClick={() => handleMethodChange('credit_card')}
              >
                <div className="payment-method-icon">💳</div>
                <div className="payment-method-details">
                  <h3>Credit/Debit Card</h3>
                  <p>Pay securely with your card</p>
                </div>
                <div className="payment-method-radio">
                  <div className={`radio-circle ${selectedMethod === 'credit_card' ? 'checked' : ''}`}></div>
                </div>
              </div>
              
              <div 
                className={`payment-method ${selectedMethod === 'paypal' ? 'selected' : ''}`}
                onClick={() => handleMethodChange('paypal')}
              >
                <div className="payment-method-icon">
                  <span className="paypal-icon">P</span>
                </div>
                <div className="payment-method-details">
                  <h3>PayPal</h3>
                  <p>Fast and secure payment with PayPal</p>
                </div>
                <div className="payment-method-radio">
                  <div className={`radio-circle ${selectedMethod === 'paypal' ? 'checked' : ''}`}></div>
                </div>
              </div>
              
              <div 
                className={`payment-method ${selectedMethod === 'bank_transfer' ? 'selected' : ''}`}
                onClick={() => handleMethodChange('bank_transfer')}
              >
                <div className="payment-method-icon">🏦</div>
                <div className="payment-method-details">
                  <h3>Bank Transfer</h3>
                  <p>Pay directly from your bank account</p>
                </div>
                <div className="payment-method-radio">
                  <div className={`radio-circle ${selectedMethod === 'bank_transfer' ? 'checked' : ''}`}></div>
                </div>
              </div>
            </div>
            
            <form className="payment-details-form" onSubmit={handlePaymentSubmit}>
              {selectedMethod === 'credit_card' && (
                <div className="credit-card-form">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={paymentDetails.cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="XXXX XXXX XXXX XXXX"
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cardName">Name on Card</label>
                    <input
                      type="text"
                      id="cardName"
                      name="cardName"
                      value={paymentDetails.cardName}
                      onChange={handleInputChange}
                      placeholder="Enter name as shown on card"
                      required
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="expiryDate"
                        value={paymentDetails.expiryDate}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={paymentDetails.cvv}
                        onChange={handleInputChange}
                        placeholder="XXX"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="save-payment-method">
                    <input
                      type="checkbox"
                      id="savePaymentMethod"
                      name="savePaymentMethod"
                      checked={paymentDetails.savePaymentMethod}
                      onChange={handleInputChange}
                    />
                    <label htmlFor="savePaymentMethod">Save this payment method for future purchases</label>
                  </div>
                </div>
              )}
              
              {selectedMethod === 'paypal' && (
                <div className="paypal-info">
                  <p>You'll be redirected to PayPal to complete your payment securely.</p>
                  <div className="paypal-logo">PayPal</div>
                </div>
              )}
              
              {selectedMethod === 'bank_transfer' && (
                <div className="bank-transfer-info">
                  <p>Use the following details to make a bank transfer:</p>
                  <div className="bank-details">
                    <div className="bank-detail-row">
                      <span className="detail-label">Bank Name:</span>
                      <span className="detail-value">GameStore Bank</span>
                    </div>
                    <div className="bank-detail-row">
                      <span className="detail-label">Account Number:</span>
                      <span className="detail-value">1234567890</span>
                    </div>
                    <div className="bank-detail-row">
                      <span className="detail-label">Routing Number:</span>
                      <span className="detail-value">087654321</span>
                    </div>
                    <div className="bank-detail-row">
                      <span className="detail-label">Reference:</span>
                      <span className="detail-value">Order #{orderId}</span>
                    </div>
                  </div>
                  <p className="bank-transfer-note">
                    Please include your order number as reference. Your order will be processed once we receive your payment.
                  </p>
                </div>
              )}
              
              <div className="payment-actions">
                <button 
                  type="button" 
                  className="back-btn"
                  onClick={() => navigate('/checkout')}
                  disabled={processing}
                >
                  Back
                </button>
                
                <button 
                  type="submit" 
                  className="pay-now-btn"
                  disabled={processing}
                >
                  {processing ? 'Processing...' : `Pay $${order.totalAmount.toFixed(2)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="payment-summary-section">
          <div className="payment-section-card">
            <h2>Order Summary</h2>
            
            <div className="order-items-summary">
              {order.items.map(item => (
                <div className="summary-item" key={item.id}>
                  <div className="summary-item-image">
                    <img src={item.game.imageUrl} alt={item.game.title} />
                  </div>
                  <div className="summary-item-details">
                    <h3>{item.game.title}</h3>
                    <p>{item.game.platform}</p>
                  </div>
                  <div className="summary-item-price">
                    <span className="quantity">x{item.quantity}</span>
                    <span className="price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="payment-totals">
              <div className="total-row">
                <span>Subtotal</span>
                <span>${(order.totalAmount / 1.1).toFixed(2)}</span>
              </div>
              
              <div className="total-row">
                <span>Tax (10%)</span>
                <span>${(order.totalAmount - (order.totalAmount / 1.1)).toFixed(2)}</span>
              </div>
              
              <div className="total-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              
              <div className="total-row grand-total">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="payment-security-info">
              <div className="security-icon">🔒</div>
              <p>
                Your payment information is secure. We use industry-standard security measures to protect your data.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment; 