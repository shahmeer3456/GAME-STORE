import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { getCart } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
import './MiniCart.css';

const MiniCart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    // When authenticated, fetch cart data
    if (isAuthenticated) {
      fetchCartData();
    } else {
      setCartItems([]);
    }
  }, [isAuthenticated]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const fetchCartData = async () => {
    try {
      setLoading(true);
      const response = await getCart();
      // Map the database fields to match component expectations
      const formattedItems = (response.cartItems || []).map(item => ({
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
      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error fetching mini cart:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleDropdown = () => {
    if (!isOpen && isAuthenticated) {
      // Refresh cart data when opening dropdown
      fetchCartData();
    }
    setIsOpen(!isOpen);
  };
  
  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };
  
  return (
    <div className="mini-cart" ref={dropdownRef}>
      <button className="mini-cart-button" onClick={toggleDropdown}>
        <span className="cart-icon">🛒</span>
        {isAuthenticated && cartItems.length > 0 && (
          <span className="cart-badge">{getTotalItems()}</span>
        )}
      </button>
      
      {isOpen && (
        <div className="mini-cart-dropdown">
          <div className="mini-cart-header">
            <h3>Your Cart</h3>
            {cartItems.length > 0 && (
              <span className="items-count">{getTotalItems()} items</span>
            )}
          </div>
          
          <div className="mini-cart-content">
            {!isAuthenticated ? (
              <div className="mini-cart-message">
                <p>Please log in to view your cart</p>
                <Link to="/login" className="mini-cart-login-btn" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </div>
            ) : loading ? (
              <div className="mini-cart-loading">Loading cart...</div>
            ) : cartItems.length === 0 ? (
              <div className="mini-cart-empty">
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="mini-cart-items">
                  {cartItems.slice(0, 3).map(item => (
                    <div className="mini-cart-item" key={item.id}>
                      <div className="mini-item-image">
                        <img src={item.game.imageUrl} alt={item.game.title} />
                      </div>
                      <div className="mini-item-details">
                        <div className="mini-item-title">{item.game.title}</div>
                        <div className="mini-item-meta">
                          <span className="mini-item-qty">Qty: {item.quantity}</span>
                          <span className="mini-item-price">${(parseFloat(item.game.price || 0) * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {cartItems.length > 3 && (
                    <div className="mini-cart-more">
                      +{cartItems.length - 3} more items
                    </div>
                  )}
                </div>
                
                <div className="mini-cart-footer">
                  <div className="mini-cart-total">
                    <span>Total:</span>
                    <span>
                      ${cartItems.reduce((total, item) => total + (parseFloat(item.game.price || 0) * item.quantity), 0).toFixed(2)}
                    </span>
                  </div>
                  
                  <Link 
                    to="/cart" 
                    className="view-cart-btn"
                    onClick={() => setIsOpen(false)}
                  >
                    View Cart
                  </Link>
                  
                  <Link 
                    to="/checkout" 
                    className="checkout-btn"
                    onClick={() => setIsOpen(false)}
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MiniCart; 