import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaPlus } from 'react-icons/fa';
import { getGames, deleteGame } from '../../services/adminService';
import '../../admin/Admin.css';

const Games = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchGames();
  }, [currentPage, filter]);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await getGames(currentPage, 10, filter);
      
      setGames(response.games);
      setTotalPages(response.totalPages);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast.error('Failed to load games');
      setLoading(false);
    }
  };

  const handleDeleteGame = async (gameId) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await deleteGame(gameId);
        toast.success('Game deleted successfully');
        fetchGames();
      } catch (error) {
        console.error('Error deleting game:', error);
        toast.error('Failed to delete game');
      }
    }
  };

  const filteredGames = games.filter(game => 
    game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && games.length === 0) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading games...</p>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Game Management</h1>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="filter-dropdown">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Games</option>
            <option value="inStock">In Stock</option>
            <option value="outOfStock">Out of Stock</option>
            <option value="onSale">On Sale</option>
          </select>
        </div>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Title</th>
              <th>Developer</th>
              <th>Publisher</th>
              <th>Genre</th>
              <th>Platform</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Release Date</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredGames.length > 0 ? (
              filteredGames.map(game => (
                <tr key={game.id}>
                  <td>
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="game-thumbnail"
                    />
                  </td>
                  <td>{game.title}</td>
                  <td>{game.developer}</td>
                  <td>{game.publisher}</td>
                  <td>{game.genre}</td>
                  <td>{game.platform}</td>
                  <td>${parseFloat(game.price || 0).toFixed(2)}</td>
                  <td>{game.discount ? `${game.discount}%` : '-'}</td>
                  <td>{new Date(game.release_date).toLocaleDateString()}</td>
                  <td>{game.inStock ? 'In Stock' : 'Out of Stock'}</td>
                  <td>
                    <div className="action-buttons">
                      <Link to={`/admin/games/edit/${game.id}`} className="action-btn view-btn">
                        Edit
                      </Link>
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteGame(game.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="no-data">
                  {searchTerm
                    ? 'No games match your search'
                    : 'No games found'}
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
      
      {/* Floating action button for adding new game */}
      <Link to="/admin/games/add" className="add-game-btn">
        <FaPlus className="plus-icon" />
        <span className="add-game-tooltip">Add New Game</span>
      </Link>
    </div>
  );
};

export default Games; 