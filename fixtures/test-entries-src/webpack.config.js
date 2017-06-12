var join = require('path').join;

module.exports = {
  context: __dirname,
  entry: './src/entry',
  output: {
    path: join(__dirname, 'dist'),
    filename: '[name].js'
  }
};
