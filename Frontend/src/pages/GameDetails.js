import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getGameById } from '../services/gameService';
import { addToCart } from '../services/cartService';
import { useAuthStore } from '../store/authStore';
import './GameDetails.css';

const GameDetails = () => {
  const { id } = useParams();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setLoading(true);
        const gameData = await getGameById(id);
        setGame(gameData);
      } catch (error) {
        console.error('Error fetching game details:', error);
        toast.error('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to your cart');
      return;
    }

    try {
      setAddingToCart(true);
      await addToCart(id, quantity);
      toast.success('Game added to your cart!');
    } catch (error) {
      console.error('Error adding game to cart:', error);
      toast.error('Failed to add game to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading game details...</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="not-found-container">
        <h2>Game Not Found</h2>
        <p>Sorry, the game you're looking for doesn't exist or has been removed.</p>
        <Link to="/" className="btn-primary">Return to Home</Link>
      </div>
    );
  }

  return (
    <div className="game-details-container">
      <div className="game-details-grid">
        <div className="game-image-container">
          <img src={game.imageUrl} alt={game.title} className="game-cover-image" />
          
          <div className="game-meta">
            <span className="game-genre">{game.genre}</span>
            <span className="game-platform">{game.platform}</span>
            <span className="game-release-date">Released: {new Date(game.releaseDate).toLocaleDateString()}</span>
          </div>
        </div>

        <div className="game-info">
          <h1 className="game-title">{game.title}</h1>
          <p className="game-developer">By {game.developer}</p>
          
          <div className="game-rating">
            {Array(5).fill('').map((_, index) => (
              <span 
                key={index}
                className={`star ${index < Math.round(game.rating) ? 'filled' : ''}`}
              >★</span>
            ))}
            <span className="rating-count">({game.reviews || 0} reviews)</span>
          </div>
          
          <div className="game-price-container">
            <h2 className="game-price">${parseFloat(game.price || 0).toFixed(2)}</h2>
            {game.discount > 0 && (
              <div className="discount-badge">
                {game.discount}% OFF
                <span className="original-price">
                  ${(parseFloat(game.price || 0) / (1 - (game.discount || 0) / 100)).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div className="game-description">
            <h3>About This Game</h3>
            <p>{game.description}</p>
          </div>
          
          <div className="purchase-controls">
            <div className="quantity-selector">
              <button 
                className="qty-btn"
                onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                disabled={quantity <= 1}
              >-</button>
              <span className="quantity">{quantity}</span>
              <button 
                className="qty-btn"
                onClick={() => setQuantity(prev => prev + 1)}
              >+</button>
            </div>
            
            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={addingToCart}
            >
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </button>
          </div>
          
          <div className="game-details-table">
            <div className="detail-row">
              <div className="detail-label">Publisher</div>
              <div className="detail-value">{game.publisher}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Platform</div>
              <div className="detail-value">{game.platform}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Genre</div>
              <div className="detail-value">{game.genre}</div>
            </div>
            <div className="detail-row">
              <div className="detail-label">Release Date</div>
              <div className="detail-value">{new Date(game.releaseDate).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameDetails; 