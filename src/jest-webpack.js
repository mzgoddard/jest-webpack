const fs = require('fs');
const {join, dirname} = require('path');

const findUp = require('find-up');
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
const jestYargs = tryRequire(
  () => require('jest/node_modules/jest-cli/node_modules/yargs/yargs'),
  () => require('jest-cli/node_modules/yargs/yargs'),
  () => require('yargs/yargs')
);
const jestArgs = tryRequire(
  () => require('jest/node_modules/jest-cli/build/cli/args'),
  () => require('jest-cli/build/cli/args')
);

function main(argv, config) {
  // Ensure JestWebpackPlugin is active

  const packageRoot = dirname(findUp.sync('package.json', {
    cwd: config.context,
  }));

  // Echo jest's argv and jest config behaviour
  const jestArgv = jestYargs(argv.slice())
    .usage(jestArgs.usage)
    .alias('help', 'h')
    .options(jestArgs.options)
    .epilogue(jestArgs.docs)
    .check(jestArgs.check)
    .version(false)
    .parse(argv.slice());

  const jestConfig = readConfig(jestArgv, packageRoot);

  // var coverageMode = process.argv
  // .reduce(function(carry, opt) {return carry || /^--coverage$/.test(opt);}, false);

  // if (coverageMode) {
  //   config.babel.plugins = (config.babel.plugins || []).concat('istanbul');
  // }

  config = Object.assign({}, config, {
    plugins: config.plugins || []
  });
  config.plugins.push(new JestWebpackPlugin({argv, jestArgv, jestConfig}));

  try {
    // If we can resolve JavascriptGenerator assume config takes a mode option.
    require.resolve('webpack/lib/JavascriptGenerator');
    // Set mode to 'development' by default.
    if (!config.mode) {
      config.mode = 'development';
    }
  }
  catch (error) {
    // If we cannot resolve JavascriptGenerator there is no mode option
  }

  var compiler = webpack(config);

  // var watchMode = process.argv
  // .reduce(function(carry, opt) {return carry || /^--watch/.test(opt);}, false);

  const watchMode = false;

  if (watchMode) {
    compiler.watch({}, function(err) {
      if (err) {
        console.error(err.stack || err);
        process.exit();
      }
    });
  }
  else {
    compiler.run(function(err) {
      if (err) {
        console.error(err.stack || err);
        process.exit();
      }
    });
  }
}

// let once = true;
if (process.argv[1] === __filename) {
  main(process.argv.slice(2), eval('require')(join(process.cwd(), 'webpack.config.js')));
}

module.exports = main;
