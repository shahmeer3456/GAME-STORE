const db = require('../config/db');
const { formatPrices } = require('../utils/dataFormatter');

// Get all games with optional filtering
exports.getAllGames = async (req, res) => {
  try {
    let query = `
      SELECT g.*, i.stock_quantity 
      FROM games g
      LEFT JOIN inventory i ON g.game_id = i.game_id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    // Apply filters if provided
    if (req.query.genre) {
      query += ' AND g.genre = ?';
      queryParams.push(req.query.genre);
    }
    
    if (req.query.platform) {
      query += ' AND g.platform LIKE ?';
      queryParams.push(`%${req.query.platform}%`);
    }
    
    if (req.query.search) {
      query += ' AND (g.title LIKE ? OR g.description LIKE ?)';
      queryParams.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }
    
    // Sort options
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-') ? req.query.sort.substring(1) : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? 'DESC' : 'ASC';
      
      if (['title', 'price', 'release_date'].includes(sortField)) {
        query += ` ORDER BY g.${sortField} ${sortOrder}`;
      }
    } else {
      // Default sort by release date
      query += ' ORDER BY g.release_date DESC';
    }
    
    const gamesData = await db.query(query, queryParams);
    
    // Format the games with numeric values for prices using utility function
    const games = formatPrices(gamesData);
    
    res.status(200).json({ games });
  } catch (error) {
    console.error('Error fetching games:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get game by ID
exports.getGameById = async (req, res) => {
  try {
    const gameId = req.params.id;
    
    const query = `
      SELECT g.*, i.stock_quantity 
      FROM games g
      LEFT JOIN inventory i ON g.game_id = i.game_id
      WHERE g.game_id = ?
    `;
    
    const games = await db.query(query, [gameId]);
    
    if (games.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    // Use utility function to format prices
    const [game] = formatPrices([games[0]]);
    
    res.status(200).json({ game });
  } catch (error) {
    console.error('Error fetching game:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get games by genre
exports.getGamesByGenre = async (req, res) => {
  try {
    const genre = req.params.genre;
    
    const query = `
      SELECT g.*, i.stock_quantity 
      FROM games g
      LEFT JOIN inventory i ON g.game_id = i.game_id
      WHERE g.genre = ?
      ORDER BY g.release_date DESC
    `;
    
    const gamesData = await db.query(query, [genre]);
    
    // Format the games with numeric values for prices using utility function
    const games = formatPrices(gamesData);
    
    res.status(200).json({ games });
  } catch (error) {
    console.error('Error fetching games by genre:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all unique genres
exports.getGenres = async (req, res) => {
  try {
    const query = 'SELECT DISTINCT genre FROM games ORDER BY genre';
    const genres = await db.query(query);
    
    res.status(200).json({ genres: genres.map(g => g.genre) });
  } catch (error) {
    console.error('Error fetching genres:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all unique platforms
exports.getPlatforms = async (req, res) => {
  try {
    const query = 'SELECT DISTINCT platform FROM games';
    const platforms = await db.query(query);
    
    // Process platforms (they are stored as comma-separated values)
    const platformSet = new Set();
    platforms.forEach(p => {
      const platformArray = p.platform.split(',').map(platform => platform.trim());
      platformArray.forEach(platform => platformSet.add(platform));
    });
    
    res.status(200).json({ platforms: Array.from(platformSet).sort() });
  } catch (error) {
    console.error('Error fetching platforms:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 