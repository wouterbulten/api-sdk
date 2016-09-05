const webpack = require('webpack');
const path = require('path');

const outputDir = path.resolve(__dirname, '../../../dist/js');

module.exports = {
  // Start point of the app
  entry: {
    its123api: './src/main.js',
    'its123api.polyfill': './src/polyfill.js',
  },

  // Add sourcemap to output
  devtool: 'source-map',

  // Output path after webpack has run
  output: {
    path: outputDir,
    filename: '[name].min.js',
  },

  module: {
    // Load all js files and convert them using babel
    loaders: [
      {
        test: /\.js$/, // Transform all .js files required somewhere with Babel
        exclude: /(node_modules|bower_components)/,
        loader: 'babel-loader',
        query: {
          presets: [
            'es2015',
          ],
          plugins: [
            'transform-es3-property-literals', // For IE < 10
            'transform-es3-member-expression-literals', // For IE < 10,
            'transform-object-rest-spread', // Add support for object spread
          ],
        },
      },
    ],
  },

  plugins: [
    // Optimize the output bundle by minifying
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
      },
      comments: false,
      sourceMap: true,
      mangle: {
        // Var names that should not change
        except: [],
      },
    }),
    // Remove any duplicate code
    new webpack.optimize.DedupePlugin(),
  ],
};
