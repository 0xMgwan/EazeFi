// Add global Buffer
import { Buffer } from 'buffer';
window.Buffer = Buffer;

// Fix for process/browser in axios
window.process = window.process || {};
window.process.browser = true;

// Freighter wallet detection polyfill
if (typeof window !== 'undefined') {
  // Check for Freighter in different locations
  const checkForFreighter = () => {
    // If freighter is already defined, do nothing
    if (window.freighter) {
      console.log('Freighter already available in window');
      return;
    }

    // Check if freighter exists in window.stellar
    if (window.stellar && window.stellar.freighter) {
      window.freighter = window.stellar.freighter;
      console.log('Found Freighter in window.stellar');
      return;
    }

    // Look for the Freighter extension by checking for its meta tag
    const freighterMeta = document.querySelector('head > meta[name="freighter"]');
    if (freighterMeta) {
      console.log('Freighter meta tag found, extension should be available');
      // Try to access it via postMessage if needed
    }
  };

  // Run the check immediately
  checkForFreighter();

  // Also run it after a short delay to ensure extension has time to initialize
  setTimeout(checkForFreighter, 1000);
}
