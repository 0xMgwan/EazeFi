const webpack = require('webpack');
const path = require('path');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Add fallbacks for Node.js core modules
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "url": require.resolve("url/"),
        "https": require.resolve("https-browserify"),
        "http": require.resolve("stream-http"),
        "buffer": require.resolve("buffer/"),
        "stream": require.resolve("stream-browserify"),
        "crypto": require.resolve("crypto-browserify"),
        "process": require.resolve("process/browser"),
        "path": require.resolve("path-browserify"),
        "util": require.resolve("util/"),
        "assert": require.resolve("assert/"),
        "fs": false,
        "os": require.resolve("os-browserify/browser"),
        "zlib": require.resolve("browserify-zlib")
      };

      // Explicitly add process/browser and https-browserify to resolve
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        'process/browser': path.resolve(__dirname, 'node_modules/process/browser.js'),
        'https': path.resolve(__dirname, 'node_modules/https-browserify/index.js')
      };

      // Provide global variables
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser'
        }),
        new webpack.DefinePlugin({
          'process.browser': JSON.stringify(true),
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
        })
      ];

      // Ignore source map warnings
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /Critical dependency: the request of a dependency is an expression/
      ];

      return webpackConfig;
    }
  }
};
