import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { cartItems, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch cart on component mount if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/?search=${searchTerm}`);
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">GS</span>
          <span className="logo-text">GameStore</span>
        </Link>

        <div className="menu-icon" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <FaTimes /> : <FaBars />}
        </div>

        <div className={`search-container ${isOpen ? 'active' : ''}`}>
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>

        <ul className={`nav-menu ${isOpen ? 'active' : ''}`}>
          <li className="nav-item">
            <Link to="/" className="nav-link" onClick={() => setIsOpen(false)}>
              Home
            </Link>
          </li>
          {isAuthenticated ? (
            <>
              <li className="nav-item">
                <Link to="/cart" className="nav-link cart-link" onClick={() => setIsOpen(false)}>
                  <FaShoppingCart />
                  <span className="cart-items-count">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0) || 0}
                  </span>
                </Link>
              </li>
              <li className="nav-item dropdown">
                <div className="nav-link dropdown-toggle">
                  <FaUser /> {user?.username}
                </div>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/orders" className="dropdown-item" onClick={() => setIsOpen(false)}>
                    Orders
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={() => setIsOpen(false)}>
                      Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/login" className="nav-link" onClick={() => setIsOpen(false)}>
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/register" className="nav-link btn-register" onClick={() => setIsOpen(false)}>
                  Register
                </Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar; 