#!/usr/bin/env node

var join = require('path').join;

function config(dir) {
  if (!dir) {
    dir = process.cwd();
  }
  var config;
  try {
    var resolved = require.resolve(join(dir, 'webpack.config.babel.js'));
    require('babel-register');
    config = require(resolved);
  }
  catch (_) {
    config = require(join(dir, 'webpack.config.js'));
  }
  return config;
}

function run(argv, webpackConfig) {
  var main;
  if (require('webpack/package.json').version.startsWith('1')) {
    main = require('./webpack-1/jest-webpack.js');
  }
  else {
    main = require('./src/jest-webpack.js');
  }

  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }

  if (!webpackConfig) {
    webpackConfig = config();
  }

  main(argv, webpackConfig);
}

if (process.mainModule === module) {
  run(process.argv.slice(2));
}

module.exports = run;
run.webpackConfig = config;
