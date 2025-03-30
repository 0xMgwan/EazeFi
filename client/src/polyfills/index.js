// Main polyfills file to be imported in index.js
import { Buffer } from 'buffer';

// Add global Buffer
window.Buffer = Buffer;

// Fix for process/browser in axios
window.process = window.process || {};
window.process.browser = true;
window.process.env = window.process.env || {};
window.process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Global for Stellar SDK
window.global = window;

// Export all polyfills
export { default as process } from './process';
export { default as https } from './https';
