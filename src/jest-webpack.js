var fs = require('fs');
var {join} = require('path');

var webpack = require('webpack');

var JestWebpackPlugin = require('./jest-webpack-plugin');

function main(config) {
  // var config = require('./webpack.config');

  // Ensure JestWebpackPlugin is active

  var coverageMode = process.argv
  .reduce(function(carry, opt) {return carry || /^--coverage$/.test(opt);}, false);

  if (coverageMode) {
    config.babel.plugins = (config.babel.plugins || []).concat('istanbul');
  }

  config.plugins.push(new JestWebpackPlugin());

  var compiler = webpack(config);

  var watchMode = process.argv
  .reduce(function(carry, opt) {return carry || /^--watch/.test(opt);}, false);

  if (watchMode) {
    compiler.watch({}, function() {});
  }
  else {
    compiler.run(function() {});
  }
}

// let once = true;
if (process.argv[1] === __filename) {
  main(eval('require')(join(process.cwd(), 'webpack.config.js')));
}

module.exports = main;
