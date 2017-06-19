const fs = require('fs');
const {join} = require('path');

const webpack = require('webpack');

const JestWebpackPlugin = require('./jest-webpack-plugin');

// Try to require jest's specific dependencies to mirror its argv and config
// behaviour to try and match how it determines things like test files to
// execute.
const tryRequire = require('./try-require');
const {readConfig} = tryRequire(
  () => require('jest/node_modules/jest-cli/node_modules/jest-config'),
  () => require('jest-cli/node_modules/jest-config'),
  () => require('jest-config')
);
const yargs = tryRequire(
  () => require('jest/node_modules/jest-cli/node_modules/yargs'),
  () => require('jest-cli/node_modules/yargs'),
  () => require('yargs')
);
const jestArgs = tryRequire(
  () => require('jest/node_modules/jest-cli/build/cli/args'),
  () => require('jest-cli/build/cli/args')
);

function main(argv, config) {
  // Ensure JestWebpackPlugin is active

  // Echo jest's argv and jest config behaviour
  const jestArgv = yargs(argv)
    .options(jestArgs.options)
    .check(jestArgs.check).argv;
  const jestConfig = readConfig(jestArgv, config.context);

  // var coverageMode = process.argv
  // .reduce(function(carry, opt) {return carry || /^--coverage$/.test(opt);}, false);

  // if (coverageMode) {
  //   config.babel.plugins = (config.babel.plugins || []).concat('istanbul');
  // }

  config.plugins = config.plugins || [];
  config.plugins.push(new JestWebpackPlugin({argv, jestArgv, jestConfig}));

  var compiler = webpack(config);

  // var watchMode = process.argv
  // .reduce(function(carry, opt) {return carry || /^--watch/.test(opt);}, false);

  const watchMode = false;

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
