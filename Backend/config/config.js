// Configuration settings

module.exports = {
  port: process.env.PORT || 5000,
  database: {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gamestore'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'gamestore_secret_key_change_in_production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'gamestore_refresh_secret_key_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  }
};