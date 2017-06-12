const {join} = require('path');

module.exports = {
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js',
  },
};
