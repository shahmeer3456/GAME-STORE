import React from 'react';
import './About.css';

const About = () => {
  return (
    <div className="about-container">
      <h1>About GameStore</h1>
      
      <section className="about-section">
        <h2>Our Mission</h2>
        <p>
          At GameStore, we're passionate about games and dedicated to providing gamers 
          with the best digital gaming experience. Our mission is to create a platform where 
          game enthusiasts can discover, purchase, and enjoy the latest and greatest titles 
          across multiple platforms.
        </p>
      </section>
      
      <section className="about-section">
        <h2>Our Story</h2>
        <p>
          Founded in 2023, GameStore began as a small project with a big vision: to create 
          a seamless digital marketplace that puts gamers first. Since then, we've grown into 
          a thriving community of passionate gamers and developers who share a love for 
          interactive entertainment.
        </p>
      </section>
      
      <section className="about-section">
        <h2>What We Offer</h2>
        <ul className="features-list">
          <li>
            <span className="feature-icon">🎮</span>
            <div className="feature-text">
              <h3>Diverse Game Selection</h3>
              <p>Curated collection of games across all genres and platforms</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">💰</span>
            <div className="feature-text">
              <h3>Competitive Pricing</h3>
              <p>Best deals and regular discounts on popular titles</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">🔒</span>
            <div className="feature-text">
              <h3>Secure Transactions</h3>
              <p>Safe and reliable payment processing</p>
            </div>
          </li>
          <li>
            <span className="feature-icon">👥</span>
            <div className="feature-text">
              <h3>Community Focus</h3>
              <p>Built by gamers, for gamers</p>
            </div>
          </li>
        </ul>
      </section>
      
      <section className="about-section">
        <h2>Contact Us</h2>
        <p>
          Have questions or feedback? We'd love to hear from you!
          <br />
          Email us at: <a href="mailto:support@gamestore.com">support@gamestore.com</a>
        </p>
      </section>
    </div>
  );
};

export default About; 