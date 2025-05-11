// Import React and related dependencies
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

// Import styles
import './index.css';
import 'react-toastify/dist/ReactToastify.css';

// Import compatibility fixes
import { applyCompatibilityFixes } from './utils/three-compatibility';
import './utils/fix-shader-chunk';

// Import app component
import App from './App';

// Apply compatibility fixes
applyCompatibilityFixes();

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <ToastContainer position="bottom-right" autoClose={3000} />
    </BrowserRouter>
  </React.StrictMode>
); 