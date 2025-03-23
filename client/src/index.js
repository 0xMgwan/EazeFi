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
