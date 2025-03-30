// Simple HTTPS polyfill for browser environment
const https = {
  request: () => {
    throw new Error('HTTPS request is not supported in browser environment');
  },
  get: () => {
    throw new Error('HTTPS get is not supported in browser environment');
  }
};

export default https;
