// Custom process polyfill for browser environment
window.process = window.process || {
  env: {
    NODE_ENV: process.env.NODE_ENV || 'development'
  },
  browser: true,
  version: '',
  nextTick: function(cb) {
    setTimeout(cb, 0);
  }
};

export default window.process;
