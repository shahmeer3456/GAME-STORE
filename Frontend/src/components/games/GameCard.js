import React from 'react';
import { Link } from 'react-router-dom';
import { FaCartPlus, FaEye } from 'react-icons/fa';
import { formatPrice, getImageUrl, formatStockInfo } from '../../utils/formatters';
import './GameCard.css';

const GameCard = ({ game, onAddToCart }) => {
  // Function to handle add to cart button click
  const handleAddToCart = (e) => {
    e.preventDefault();
    onAddToCart();
  };
  
  return (
    <div className="game-card">
      <div className="game-card-image">
        <img src={getImageUrl(game.image_url)} alt={game.title} />
        <div className="game-card-overlay">
          <Link to={`/games/${game.game_id}`} className="view-btn">
            <FaEye /> View
          </Link>
          <button 
            className="cart-btn" 
            onClick={handleAddToCart}
            disabled={!game.stock_quantity || game.stock_quantity < 1}
          >
            <FaCartPlus /> Add to Cart
          </button>
        </div>
        {game.stock_quantity === 0 && <div className="out-of-stock">Out of Stock</div>}
      </div>
      <div className="game-card-content">
        <Link to={`/games/${game.game_id}`} className="game-title">
          {game.title}
        </Link>
        <div className="game-info">
          <span className="game-genre">{game.genre}</span>
          <span className="game-platform">{game.platform.split(',')[0]}</span>
        </div>
        <div className="game-price-container">
          <span className="game-price">{formatPrice(game.price)}</span>
          <span className="stock-info">
            {formatStockInfo(game.stock_quantity)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default GameCard; 