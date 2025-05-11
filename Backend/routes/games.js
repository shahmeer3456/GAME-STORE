const express = require('express');
const gamesController = require('../controllers/gamesController');

const router = express.Router();

// Get all games with optional filtering
router.get('/', gamesController.getAllGames);

// Get game by ID
router.get('/:id', gamesController.getGameById);

// Get games by genre
router.get('/genre/:genre', gamesController.getGamesByGenre);

// Get all unique genres
router.get('/filters/genres', gamesController.getGenres);

// Get all unique platforms
router.get('/filters/platforms', gamesController.getPlatforms);

module.exports = router; 