#!/usr/bin/env node

var join = require('path').join;

var main;
if (require('webpack/package.json').version.startsWith('1')) {
  main = require('./webpack-1/jest-webpack.js');
}
else {
  main = require('./src/jest-webpack.js');
}

var config;
try {
  var resolved = require.resolve(join(process.cwd(), 'webpack.config.babel.js'));
  require('babel-register');
  config = require(resolved);
}
catch (_) {
  config = require(join(process.cwd(), 'webpack.config.js'));
}

main(config);
