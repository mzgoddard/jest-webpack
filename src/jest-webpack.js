#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var webpack = require('webpack');

function main(config) {
  // var config = require('./webpack.config');

  // Ensure JestWebpackPlugin is active

  var coverageMode = process.argv
  .reduce(function(carry, opt) {return carry || /^--coverage$/.test(opt);}, false);

  if (coverageMode) {
    config.babel.plugins = (config.babel.plugins || []).concat('istanbul');
  }

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

if (process.mainModule === module) {
  main(require(join(process.cwd(), 'webpack.config.js')));
}
