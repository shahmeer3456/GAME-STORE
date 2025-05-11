import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebook, FaTwitter, FaInstagram, FaYoutube, FaEnvelope, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3 className="footer-title">GameStore</h3>
            <p className="footer-description">
              Your ultimate destination for all gaming needs. 
              Browse our extensive collection of games across all platforms.
            </p>
            <div className="footer-social">
              <a href="#!" className="social-icon">
                <FaFacebook />
              </a>
              <a href="#!" className="social-icon">
                <FaTwitter />
              </a>
              <a href="#!" className="social-icon">
                <FaInstagram />
              </a>
              <a href="#!" className="social-icon">
                <FaYoutube />
              </a>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              <li>
                <Link to="/">Home</Link>
              </li>
              <li>
                <Link to="/about">About Us</Link>
              </li>
              <li>
                <Link to="/">Games</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
              <li>
                <Link to="/login">Login</Link>
              </li>
              <li>
                <Link to="/register">Register</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Game Categories</h3>
            <ul className="footer-links">
              <li>
                <Link to="/?genre=Action">Action</Link>
              </li>
              <li>
                <Link to="/?genre=Adventure">Adventure</Link>
              </li>
              <li>
                <Link to="/?genre=RPG">RPG</Link>
              </li>
              <li>
                <Link to="/?genre=Strategy">Strategy</Link>
              </li>
              <li>
                <Link to="/?genre=Sports">Sports</Link>
              </li>
              <li>
                <Link to="/?genre=Simulation">Simulation</Link>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact">
              <li>
                <FaMapMarkerAlt className="contact-icon" />
                <span>123 Gaming Street, Digital City</span>
              </li>
              <li>
                <FaPhone className="contact-icon" />
                <span>+1 234 567 8901</span>
              </li>
              <li>
                <FaEnvelope className="contact-icon" />
                <span>info@gamestore.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} GameStore. All Rights Reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 