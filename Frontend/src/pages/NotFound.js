import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-code">404</div>
        
        <h1>Page Not Found</h1>
        
        <p>
          Oops! The page you are looking for might have been removed, 
          had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="game-controller">
          <div className="controller-body">
            <div className="d-pad">
              <div className="d-up"></div>
              <div className="d-right"></div>
              <div className="d-down"></div>
              <div className="d-left"></div>
            </div>
            <div className="center-circle"></div>
            <div className="buttons">
              <div className="btn-top"></div>
              <div className="btn-right"></div>
              <div className="btn-bottom"></div>
              <div className="btn-left"></div>
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <Link to="/" className="home-button">
            Return to Home
          </Link>
          
          <Link to="/games" className="browse-button">
            Browse Games
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 