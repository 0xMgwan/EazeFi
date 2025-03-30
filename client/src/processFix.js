// Fix for process/browser polyfill
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

// Ensure Stellar SDK has the environment it needs
window.global = window;
