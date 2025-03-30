const webpack = require('webpack');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

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

      // Don't use direct path references as they cause issues in Vercel
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias
      };

      // Use NodePolyfillPlugin to handle all Node.js polyfills
      webpackConfig.plugins = [
        ...webpackConfig.plugins,
        new NodePolyfillPlugin(),
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process'
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
