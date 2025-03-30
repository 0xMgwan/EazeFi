// Fix for process/browser polyfill - must be first
if (typeof process === 'undefined') {
  window.process = { 
    browser: true, 
    env: { 
      NODE_ENV: 'production' 
    } 
  };
}

// Add global Buffer
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Ensure global is defined
window.global = window;

import React from 'react';
import ReactDOM from 'react-dom/client';
// Import polyfills
import './polyfills';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
