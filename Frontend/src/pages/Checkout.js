import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCart } from '../services/cartService';
import { createOrder } from '../services/orderService';
import { useAuthStore } from '../store/authStore';
import './Checkout.css';

const Checkout = () => {
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  
  // Refactored form data using parameter objects
  const [formData, setFormData] = useState({
    customer: {
      fullName: '',
      email: ''
    },
    shippingAddress: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    payment: {
      method: 'creditCard', // Default payment method
      creditCard: {
        number: '',
        name: '',
        expiryDate: '',
        cvv: ''
      }
    }
  });

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        const cartData = await getCart();
        
        // Format cart items to match the expected structure and ensure items is always an array
        const formattedCartItems = (cartData.cartItems || []).map(item => ({
          id: item.cart_id,
          quantity: item.quantity,
          game: {
            id: item.game_id,
            title: item.title,
            platform: item.platform || '',
            price: parseFloat(item.price || 0),
            imageUrl: item.image_url || '/images/game-placeholder.jpg'
          }
        }));
        
        setCart({
          items: formattedCartItems,
          total: parseFloat(cartData.total || 0)
        });
        
        // Pre-fill form data if user is authenticated
        if (isAuthenticated && user) {
          setFormData(prevData => ({
            ...prevData,
            customer: {
              ...prevData.customer,
              fullName: user.name || '',
              email: user.email || ''
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        toast.error('Failed to load your cart');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    // Redirect if not authenticated
    if (!isAuthenticated) {
      toast.error('Please login to access checkout');
      navigate('/login');
      return;
    }

    fetchCart();
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested form structure
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else if (name === 'paymentMethod') {
      // Handle payment method selection
      setFormData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          method: value
        }
      }));
    } else if (name.startsWith('card.')) {
      // Handle credit card fields
      const cardField = name.replace('card.', '');
      setFormData(prev => ({
        ...prev,
        payment: {
          ...prev.payment,
          creditCard: {
            ...prev.payment.creditCard,
            [cardField]: value
          }
        }
      }));
    }
  };

  // Validate customer information
  const validateCustomer = (customer, errors) => {
    if (!customer.fullName) errors.push('Full name is required');
    if (!customer.email || !/^\S+@\S+\.\S+$/.test(customer.email)) 
      errors.push('Valid email is required');
    
    return errors;
  };
  
  // Validate shipping address
  const validateShippingAddress = (address, errors) => {
    if (!address.address) errors.push('Address is required');
    if (!address.city) errors.push('City is required');
    if (!address.state) errors.push('State is required');
    if (!address.zipCode) errors.push('ZIP code is required');
    if (!address.country) errors.push('Country is required');
    
    return errors;
  };
  
  // Validate payment information
  const validatePayment = (payment, errors) => {
    if (payment.method === 'creditCard') {
      const { creditCard } = payment;
      
      if (!creditCard.number || !/^\d{16}$/.test(creditCard.number.replace(/\s/g, ''))) 
        errors.push('Valid 16-digit card number is required');
      if (!creditCard.name) errors.push('Name on card is required');
      if (!creditCard.expiryDate || !/^\d{2}\/\d{2}$/.test(creditCard.expiryDate)) 
        errors.push('Expiry date in MM/YY format is required');
      if (!creditCard.cvv || !/^\d{3,4}$/.test(creditCard.cvv)) 
        errors.push('Valid CVV is required');
    }
    
    return errors;
  };

  const validateForm = () => {
    let errors = [];
    
    errors = validateCustomer(formData.customer, errors);
    errors = validateShippingAddress(formData.shippingAddress, errors);
    errors = validatePayment(formData.payment, errors);
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
      return;
    }

    try {
      setSubmitting(true);
      
      // Create order with the selected payment method
      const orderData = {
        shippingAddress: {
          fullName: formData.customer.fullName,
          address: formData.shippingAddress.address,
          city: formData.shippingAddress.city,
          state: formData.shippingAddress.state,
          zipCode: formData.shippingAddress.zipCode,
          country: formData.shippingAddress.country
        },
        paymentMethod: formData.payment.method === 'creditCard' 
          ? 'Credit/Debit Card' 
          : formData.payment.method === 'paypal' 
            ? 'PayPal' 
            : 'Cash on Delivery'
      };
      
      // If using credit card, add masked card info (NEVER send full card details)
      if (formData.payment.method === 'creditCard') {
        const lastFourDigits = formData.payment.creditCard.number.replace(/\s/g, '').slice(-4);
        orderData.paymentDetails = {
          cardLastFour: lastFourDigits,
          cardName: formData.payment.creditCard.name
        };
      }
      
      const response = await createOrder(orderData);
      
      // Create a direct URL to the order success page with full details
      const searchParams = new URLSearchParams({
        id: response.orderId || 'unknown',
        total: parseFloat(response.totalAmount || 0).toFixed(2),
        date: response.orderDate || new Date().toISOString(),
        status: response.status || 'pending',
        paymentMethod: orderData.paymentMethod
      });
      
      // Navigate to order success page with order parameters
      navigate(`/order-success?${searchParams.toString()}`);
      toast.success('Order placed successfully!');
      
    } catch (error) {
      console.error('Error processing order:', error);
      toast.error('Failed to process your order. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
    setFormData(prev => ({
      ...prev,
      payment: {
        ...prev.payment,
        creditCard: {
          ...prev.payment.creditCard,
          number: formattedValue
        }
      }
    }));
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="checkout-container">
        <div className="checkout-empty">
          <h2>Your cart is empty</h2>
          <p>Add some games to your cart before proceeding to checkout.</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Browse Games
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      
      <div className="checkout-grid">
        <div className="checkout-form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h2>Shipping Information</h2>
              
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <input
                  type="text"
                  id="fullName"
                  name="customer.fullName"
                  value={formData.customer.fullName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="customer.email"
                  value={formData.customer.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input
                  type="text"
                  id="address"
                  name="shippingAddress.address"
                  value={formData.shippingAddress.address}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="shippingAddress.city"
                    value={formData.shippingAddress.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="shippingAddress.state"
                    value={formData.shippingAddress.state}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="shippingAddress.zipCode"
                    value={formData.shippingAddress.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="country">Country</label>
                  <select
                    id="country"
                    name="shippingAddress.country"
                    value={formData.shippingAddress.country}
                    onChange={handleChange}
                    required
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                    <option value="Germany">Germany</option>
                    <option value="France">France</option>
                    <option value="Japan">Japan</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="form-section">
              <h2>Payment Method</h2>
              
              <div className="payment-methods">
                <div className="payment-method-option">
                  <input
                    type="radio"
                    id="creditCard"
                    name="paymentMethod"
                    value="creditCard"
                    checked={formData.payment.method === 'creditCard'}
                    onChange={handleChange}
                  />
                  <label htmlFor="creditCard" className="payment-method-label">
                    <div className="payment-icon credit-card-icon">💳</div>
                    <div className="payment-method-info">
                      <span className="payment-method-name">Credit/Debit Card</span>
                      <span className="payment-method-description">Pay securely with your card</span>
                    </div>
                  </label>
                </div>
                
                <div className="payment-method-option">
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.payment.method === 'paypal'}
                    onChange={handleChange}
                  />
                  <label htmlFor="paypal" className="payment-method-label">
                    <div className="payment-icon paypal-icon">🅿️</div>
                    <div className="payment-method-info">
                      <span className="payment-method-name">PayPal</span>
                      <span className="payment-method-description">Pay with your PayPal account</span>
                    </div>
                  </label>
                </div>
                
                <div className="payment-method-option">
                  <input
                    type="radio"
                    id="cashOnDelivery"
                    name="paymentMethod"
                    value="cashOnDelivery"
                    checked={formData.payment.method === 'cashOnDelivery'}
                    onChange={handleChange}
                  />
                  <label htmlFor="cashOnDelivery" className="payment-method-label">
                    <div className="payment-icon cod-icon">💵</div>
                    <div className="payment-method-info">
                      <span className="payment-method-name">Cash on Delivery</span>
                      <span className="payment-method-description">Pay when you receive your order</span>
                    </div>
                  </label>
                </div>
              </div>
              
              {formData.payment.method === 'creditCard' && (
                <div className="card-details">
                  <div className="form-group">
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="card.number"
                      value={formData.payment.creditCard.number}
                      onChange={handleCardNumberChange}
                      placeholder="XXXX XXXX XXXX XXXX"
                      required={formData.payment.method === 'creditCard'}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="cardName">Name on Card</label>
                    <input
                      type="text"
                      id="cardName"
                      name="card.name"
                      value={formData.payment.creditCard.name}
                      onChange={handleChange}
                      required={formData.payment.method === 'creditCard'}
                    />
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="expiryDate">Expiry Date (MM/YY)</label>
                      <input
                        type="text"
                        id="expiryDate"
                        name="card.expiryDate"
                        value={formData.payment.creditCard.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        required={formData.payment.method === 'creditCard'}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="cvv">CVV</label>
                      <input
                        type="text"
                        id="cvv"
                        name="card.cvv"
                        value={formData.payment.creditCard.cvv}
                        onChange={handleChange}
                        placeholder="XXX"
                        required={formData.payment.method === 'creditCard'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.payment.method === 'paypal' && (
                <div className="paypal-info">
                  <p className="payment-info-text">
                    You will be redirected to PayPal to complete your payment after placing the order.
                  </p>
                </div>
              )}

              {formData.payment.method === 'cashOnDelivery' && (
                <div className="cod-info">
                  <p className="payment-info-text">
                    Pay with cash when your order is delivered to your address. Additional fees may apply.
                  </p>
                </div>
              )}
            </div>
            
            <div className="checkout-actions">
              <button
                type="button"
                className="back-btn"
                onClick={() => navigate('/cart')}
                disabled={submitting}
              >
                Back to Cart
              </button>
              
              <button
                type="submit"
                className="place-order-btn"
                disabled={submitting}
              >
                {submitting ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
        
        <div className="order-summary-section">
          <div className="order-summary">
            <h2>Order Summary</h2>
            
            <div className="order-items">
              {cart.items.map(item => (
                <div className="order-item" key={item.id}>
                  <div className="order-item-image">
                    <img src={item.game.imageUrl} alt={item.game.title} />
                  </div>
                  <div className="order-item-details">
                    <h3>{item.game.title}</h3>
                    <p>{item.game.platform}</p>
                    <div className="order-item-price">
                      <span className="item-price">${(parseFloat(item.game.price || 0) * item.quantity).toFixed(2)}</span>
                      <span className="item-quantity">Qty: {item.quantity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="order-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${parseFloat(cart.total || 0).toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Tax</span>
                <span>${(parseFloat(cart.total || 0) * 0.1).toFixed(2)}</span>
              </div>
              
              <div className="summary-row">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              
              <div className="summary-total">
                <span>Total</span>
                <span>${(parseFloat(cart.total || 0) * 1.1).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout; 