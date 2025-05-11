import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getCart, updateCartItem, removeFromCart, clearCart } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCart = async () => {
      try {
        setLoading(true);
        if (isAuthenticated) {
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
        } else {
          // For non-authenticated users, you might want to get cart from localStorage
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error fetching cart:', error);
        toast.error('Failed to load your cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isAuthenticated]);

  const handleQuantityChange = async (cartId, currentQuantity, newQuantity) => {
    if (newQuantity < 1) return;
    if (newQuantity === currentQuantity) return;

    try {
      setUpdatingItem(cartId);
      await updateCartItem(cartId, newQuantity);
      
      // Update state locally
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === cartId ? { ...item, quantity: newQuantity } : item
        )
      );
      
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating cart:', error);
      toast.error('Failed to update cart');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleRemoveItem = async (cartId) => {
    try {
      setUpdatingItem(cartId);
      await removeFromCart(cartId);
      
      // Remove item from local state
      setCartItems(prevItems => prevItems.filter(item => item.id !== cartId));
      
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    } finally {
      setUpdatingItem(null);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        setLoading(true);
        await clearCart();
        setCartItems([]);
        toast.success('Cart cleared');
      } catch (error) {
        console.error('Error clearing cart:', error);
        toast.error('Failed to clear cart');
      } finally {
        setLoading(false);
      }
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const itemPrice = parseFloat(item.game.price || 0) * item.quantity;
      return total + itemPrice;
    }, 0);
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.info('Please login to checkout');
      navigate('/login');
      return;
    }
    
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading your cart...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Cart</h1>
        </div>
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Please login to view your cart</p>
          <Link to="/login" className="btn-primary">Login</Link>
          <Link to="/" className="btn-secondary">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="cart-container">
        <div className="cart-header">
          <h1>Your Cart</h1>
        </div>
        <div className="empty-cart">
          <div className="empty-cart-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any games to your cart yet</p>
          <Link to="/" className="btn-primary">Browse Games</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-header">
        <h1>Your Cart</h1>
        <button 
          className="clear-cart-btn"
          onClick={handleClearCart}
          disabled={loading}
        >
          Clear Cart
        </button>
      </div>

      <div className="cart-content">
        <div className="cart-items">
          {cartItems.map(item => (
            <div className="cart-item" key={item.id}>
              <div className="cart-item-image">
                <img src={item.game.imageUrl} alt={item.game.title} />
              </div>
              
              <div className="cart-item-details">
                <Link to={`/games/${item.game.id}`} className="item-title">
                  {item.game.title}
                </Link>
                <p className="item-platform">{item.game.platform}</p>
              </div>
              
              <div className="cart-item-quantity">
                <button 
                  onClick={() => handleQuantityChange(item.id, item.quantity, Math.max(1, item.quantity - 1))}
                  disabled={updatingItem === item.id || item.quantity <= 1}
                  className="qty-btn"
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button 
                  onClick={() => handleQuantityChange(item.id, item.quantity, item.quantity + 1)}
                  disabled={updatingItem === item.id}
                  className="qty-btn"
                >
                  +
                </button>
              </div>
              
              <div className="cart-item-price">
                <span className="item-price">${(parseFloat(item.game.price || 0) * item.quantity).toFixed(2)}</span>
                <span className="item-unit-price">${parseFloat(item.game.price || 0).toFixed(2)} each</span>
              </div>
              
              <button 
                className="remove-btn"
                onClick={() => handleRemoveItem(item.id)}
                disabled={updatingItem === item.id}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <h2>Order Summary</h2>
          
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>
          
          <div className="summary-row">
            <span>Tax</span>
            <span>${(calculateTotal() * 0.1).toFixed(2)}</span>
          </div>
          
          <div className="summary-total">
            <span>Total</span>
            <span>${(calculateTotal() * 1.1).toFixed(2)}</span>
          </div>
          
          <button 
            className="checkout-btn"
            onClick={handleCheckout}
            disabled={loading}
          >
            Proceed to Checkout
          </button>
          
          <Link to="/" className="continue-shopping">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cart; 