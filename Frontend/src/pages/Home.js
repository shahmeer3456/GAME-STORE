import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaSort, FaFilter, FaTimes } from 'react-icons/fa';
import { useGameStore } from '../store/gameStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import HeroScene from '../components/3d/HeroScene';
import GameCard from '../components/games/GameCard';
import './Home.css';

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { games, genres, platforms, filters, loading, fetchGames, fetchGenres, fetchPlatforms, updateFilters, clearFilters } = useGameStore();
  const { addItem } = useCartStore();
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  const [showHero, setShowHero] = useState(true);
  const gamesRef = useRef(null);

  // Parse query params on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get('search') || '';
    const genreQuery = params.get('genre') || '';
    const platformQuery = params.get('platform') || '';
    const sortQuery = params.get('sort') || '-release_date';
    const skipHero = params.get('skipHero') === 'true';
    
    if (skipHero) {
      setShowHero(false);
    }

    // Update filters from URL
    updateFilters({
      search: searchQuery,
      genre: genreQuery,
      platform: platformQuery,
      sort: sortQuery
    });

    // Fetch initial data
    fetchGames({
      search: searchQuery,
      genre: genreQuery,
      platform: platformQuery,
      sort: sortQuery
    }).catch(err => setError('Failed to fetch games'));
    
    fetchGenres().catch(err => console.error('Failed to fetch genres'));
    fetchPlatforms().catch(err => console.error('Failed to fetch platforms'));
  }, [location.search, fetchGames, fetchGenres, fetchPlatforms, updateFilters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateFilters({ [name]: value });
  };

  const handleSortChange = (e) => {
    const { value } = e.target;
    updateFilters({ sort: value });
  };

  const handleSubmitFilters = () => {
    // Build query params
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.platform) params.append('platform', filters.platform);
    if (filters.sort) params.append('sort', filters.sort);
    params.append('skipHero', 'true'); // Always skip hero when applying filters

    // Update URL without reloading page
    navigate(`/?${params.toString()}`);
    setShowFilters(false);
    setShowHero(false);
  };

  const handleClearFilters = () => {
    clearFilters();
    navigate('/?skipHero=true');
  };

  const handleAddToCart = async (gameId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    await addItem(gameId);
  };
  
  const handleAdventureClick = () => {
    setShowHero(false);
    if (gamesRef.current) {
      gamesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Ensure games is always an array
  const gamesArray = Array.isArray(games) ? games : [];

  return (
    <div className="home-page">
      {/* 3D Hero Section - Only show if showHero is true */}
      {showHero && (
        <>
          <HeroScene />
        </>
      )}

      {/* Games Section */}
      <section className="games-section" id="games" ref={gamesRef}>
        <div className="games-header">
          <h2 className="section-title">Featured Games</h2>
          
          <div className="filter-controls">
            <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? <FaTimes /> : <FaFilter />} Filters
            </button>
            
            <div className="sort-control">
              <label htmlFor="sort">
                <FaSort /> Sort by:
              </label>
              <select
                id="sort"
                name="sort"
                value={filters.sort}
                onChange={handleSortChange}
                onBlur={handleSubmitFilters}
              >
                <option value="-release_date">Newest</option>
                <option value="price">Price: Low to High</option>
                <option value="-price">Price: High to Low</option>
                <option value="title">Name: A to Z</option>
                <option value="-title">Name: Z to A</option>
              </select>
            </div>
          </div>
        </div>
        
        {/* Filters Panel */}
        <div className={`filters-panel ${showFilters ? 'active' : ''}`}>
          <div className="filter-group">
            <label htmlFor="genre">Genre</label>
            <select
              id="genre"
              name="genre"
              value={filters.genre}
              onChange={handleFilterChange}
            >
              <option value="">All Genres</option>
              {Array.isArray(genres) && genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="platform">Platform</label>
            <select
              id="platform"
              name="platform"
              value={filters.platform}
              onChange={handleFilterChange}
            >
              <option value="">All Platforms</option>
              {Array.isArray(platforms) && platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="search">Search</label>
            <input
              type="text"
              id="search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search games..."
            />
          </div>
          
          <div className="filter-actions">
            <button className="btn btn-secondary" onClick={handleClearFilters}>
              Clear Filters
            </button>
            <button className="btn" onClick={handleSubmitFilters}>
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Games Grid */}
        {loading ? (
          <div className="loader">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <h3>Error loading games</h3>
            <p>{error}</p>
            <button className="btn" onClick={() => window.location.reload()}>
              Try Again
            </button>
          </div>
        ) : (
          <>
            {gamesArray.length === 0 ? (
              <div className="no-games">
                <h3>No games found</h3>
                <p>Try changing your filters or search term</p>
                <button className="btn" onClick={handleClearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="games-grid">
                {gamesArray.map(game => (
                  <GameCard
                    key={game.game_id}
                    game={game}
                    onAddToCart={() => handleAddToCart(game.game_id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Home; 