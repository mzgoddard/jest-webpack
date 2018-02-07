var join = require('path').join;
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
var webpackIf = require('webpack-if');

var AssetsBuiltPlugin = require('../assets-built-plugin');

var webpackVersion = require('webpack/package.json').version;
var ifWebpack1 = webpackIf.ifElse(webpackVersion.startsWith('1'));

module.exports = webpackIf({
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    loaders: ifWebpack1([
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader'],
      },
    ]),
    rules: ifWebpack1(null, [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ]),
  },
  plugins: [
    // new HardSourceWebpackPlugin(),
    new AssetsBuiltPlugin()
  ]
});
