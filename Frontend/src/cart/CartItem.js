import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import './CartItem.css';

const CartItem = ({ 
  item, 
  onQuantityChange, 
  onRemove, 
  isUpdating = false,
  showControls = true
}) => {
  const handleQuantityDecrease = () => {
    if (item.quantity > 1) {
      onQuantityChange(item.id, item.quantity, item.quantity - 1);
    }
  };

  const handleQuantityIncrease = () => {
    onQuantityChange(item.id, item.quantity, item.quantity + 1);
  };

  return (
    <div className="cart-item-component">
      <div className="cart-item-image">
        <Link to={`/games/${item.game.id}`}>
          <img src={item.game.imageUrl} alt={item.game.title} />
        </Link>
      </div>
      
      <div className="cart-item-details">
        <Link to={`/games/${item.game.id}`} className="item-title">
          {item.game.title}
        </Link>
        <p className="item-platform">{item.game.platform}</p>
      </div>
      
      {showControls ? (
        <div className="cart-item-quantity">
          <button 
            className="qty-btn"
            onClick={handleQuantityDecrease}
            disabled={item.quantity <= 1 || isUpdating}
          >
            -
          </button>
          <span className="quantity">{item.quantity}</span>
          <button 
            className="qty-btn"
            onClick={handleQuantityIncrease}
            disabled={isUpdating}
          >
            +
          </button>
        </div>
      ) : (
        <div className="cart-item-quantity-static">
          <span>Qty: {item.quantity}</span>
        </div>
      )}
      
      <div className="cart-item-price">
        <span className="item-price">${(parseFloat(item.game.price || 0) * item.quantity).toFixed(2)}</span>
        <span className="item-unit-price">${parseFloat(item.game.price || 0).toFixed(2)} each</span>
      </div>
      
      {showControls && (
        <button 
          className="remove-btn"
          onClick={() => onRemove(item.id)}
          disabled={isUpdating}
          aria-label="Remove item"
        >
          ✕
        </button>
      )}
    </div>
  );
};

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    quantity: PropTypes.number.isRequired,
    game: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      platform: PropTypes.string.isRequired,
      price: PropTypes.number.isRequired,
      imageUrl: PropTypes.string.isRequired
    }).isRequired
  }).isRequired,
  onQuantityChange: PropTypes.func,
  onRemove: PropTypes.func,
  isUpdating: PropTypes.bool,
  showControls: PropTypes.bool
};

export default CartItem; 