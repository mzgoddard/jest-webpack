var join = require('path').join;

if (require('webpack/package.json').version.startsWith('1')) {
  require('./webpack-1/jest-webpack.js')(require(join(process.cwd(), 'webpack.config.js')));
}
else {
  require('./src/jest-webpack.js')(require(join(process.cwd(), 'webpack.config.js')));
}
