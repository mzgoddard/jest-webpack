#!/usr/bin/env node

function versionInfo() {
  return `jest-webpack ${require('./package.json').version}\n` +
  `jest ${require('jest/package.json').version}\n` +
  `webpack ${require('webpack/package.json').version}`;
}

function tryRequire(attempts) {
  attempts = Array.from(arguments);
  var err;
  for (var i = 0; i < attempts.length; i++) {
    var fn = attempts[i];
    try {
      var exports = fn();
      return exports.default || exports;
    }
    catch (_) {err = _;}
  }
  throw err;
}

function run(argv, webpackConfig) {
  var jestArgvPortion, webpackArgvPortion;
  var webpackArgIndex =
    ~(~argv.lastIndexOf('--') || ~argv.lastIndexOf('--webpack'));
  if (webpackArgIndex === -1) {
    jestArgvPortion = argv;
    webpackArgvPortion = [];
  }
  else {
    jestArgvPortion = argv.slice(0, webpackArgIndex);
    webpackArgvPortion = argv.slice(webpackArgIndex);
  }

  if (!webpackConfig) {
    var webpackYargs = require('yargs/yargs')([]);
    tryRequire(
      function() {return require('webpack/bin/config-yargs');},
      function() {return require('webpack-cli/bin/config-yargs');}
    )(webpackYargs);
    var webpackArgv = webpackYargs.parse(webpackArgvPortion);
    webpackConfig = tryRequire(
      function() {return require('webpack/bin/convert-argv');},
      function() {return require('webpack-cli/bin/convert-argv');}
    )(
      webpackYargs, webpackArgv
    );
  }

  if (typeof webpackConfig.then === 'function') {
    webpackConfig.then(function(config) {run(argv, config);})
    .catch(function(err) {
      console.error(err.stack || err);
      process.exit();
    });
    return;
  }

  if (Array.isArray(webpackConfig)) {
    console.error(
      'jest-webpack does not support webpack\'s multi-compiler array ' +
      'configuration at this time.'
    );
    process.exit(1);
  }

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

  main(argv, webpackConfig);
}

if (process.mainModule === module) {
  const jestWebpackYargs = require('yargs/yargs')(process.argv)
    .reset()
    .usage(`${versionInfo()}\n\nUsage: jest-webpack [jest options] [--[webpack] [webpack options]]`);
  jestWebpackYargs.version(false).parse();

  run(process.argv.slice(2));
}

module.exports = run;
