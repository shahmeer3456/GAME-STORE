# GameStore E-Commerce Platform

A full-stack e-commerce web application for selling video games. Built with React.js, Node.js, and MySQL.

## Features

- User authentication (sign up, login, JWT)
- Browse games with filtering (genre, platform, search)
- Product details page
- Shopping cart functionality
- Order processing and payment simulation
- User profile and order history
- Admin dashboard
- Game inventory management
- Order management
- 3D interactive elements using Three.js

## Technologies Used

### Frontend
- React.js
- React Router
- Zustand (state management)
- Axios (API calls)
- React Three Fiber / Drei (3D components)
- CSS (custom styling)

### Backend
- Node.js
- Express.js
- MySQL (database)
- JWT (authentication)
- Bcrypt.js (password hashing)
- Multer (file uploads)

## Project Structure

```
GameStore/
├── backend/              # Node.js backend
│   ├── config/           # Configuration files
│   ├── controllers/      # API controllers
│   ├── middleware/       # Middleware functions
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   ├── uploads/          # Game images uploads
│   └── server.js         # Entry point
├── frontend/             # React frontend
│   ├── public/           # Public assets
│   └── src/              # Source files
│       ├── components/   # React components
│       ├── pages/        # Page components
│       ├── services/     # API services
│       ├── store/        # State management
│       └── utils/        # Utility functions
└── database/             # Database scripts
    ├── schema.sql        # Database schema
    └── sample_data.sql   # Sample data
```

## Installation and Setup

### Prerequisites
- Node.js (v14+ recommended)
- npm or yarn
- MySQL server

### Database Setup
1. Create a MySQL database named 'gamestore'
2. Run the schema.sql script to create the tables
3. Run sample_data.sql to populate the database with sample data

```bash
mysql -u root -p < GameStore/database/schema.sql
mysql -u root -p < GameStore/database/sample_data.sql
```

### Running Both Servers (Easy Method)
You can run both the frontend and backend servers with a single command using the provided script:

```bash
# Windows
start-dev.bat

# macOS/Linux
./start-dev.sh
```

This will start both servers and open the application in your default browser.

### Backend Setup
1. Navigate to the backend directory
```bash
cd GameStore/backend
```

2. Install dependencies
```bash
npm install
```

3. Create a .env file with the following variables
```
PORT=5000
DB_HOST=localhost
DB_USER=your_db_username
DB_PASSWORD=your_db_password
DB_NAME=gamestore
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

4. Start the server
```bash
npm run dev
```

### Frontend Setup
1. Navigate to the frontend directory
```bash
cd GameStore/frontend
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm start
```

The application should now be running at http://localhost:3000

## API Integration
The frontend and backend are integrated using:

1. Axios for API requests 
2. Proxy middleware to avoid CORS issues during development
3. API status monitoring to check backend connectivity
4. JWT authentication tokens stored in localStorage

The frontend proxies all `/api` requests to the backend server running on port 5000.

## User Accounts

- Admin:
  - Email: admin@gamestore.com
  - Password: admin123

- Sample Customer:
  - Email: john@example.com
  - Password: password123

## License

This project is licensed under the MIT License

## Acknowledgments

- Game images and descriptions are for demonstration purposes only 