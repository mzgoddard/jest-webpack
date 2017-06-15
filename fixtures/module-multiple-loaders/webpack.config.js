var join = require('path').join;
var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');

module.exports = {
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new HardSourceWebpackPlugin({
      cacheDirectory: __dirname + '/node_modules/.cache/hard-source/[confighash]',
      configHash: require('node-object-hash')({sort: false}).hash,
    })
  ]
};
