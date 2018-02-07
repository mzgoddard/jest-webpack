var join = require('path').join;
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

var AssetsBuiltPlugin = require('../assets-built-plugin');

module.exports = {
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    // new HardSourceWebpackPlugin(),
    new AssetsBuiltPlugin()
  ]
};
