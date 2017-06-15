const {join} = require('path');
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
  plugins: [
    new HardSourceWebpackPlugin()
  ]
};
