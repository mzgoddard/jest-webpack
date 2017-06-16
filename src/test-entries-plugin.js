const {readFileSync} = require('fs');
const {resolve} = require('path');

const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');

// Try and require jest's handling for finding source files so we can get the
// test files jest will test once the webpack step is complete.
const tryRequire = require('./try-require');
const SearchSource = tryRequire(
  () => require('jest/node_modules/jest-cli/build/SearchSource'),
  () => require('jest-cli/build/SearchSource')
);
const createContext = tryRequire(
  () => require('jest/node_modules/jest-cli/build/lib/createContext'),
  () => require('jest-cli/build/lib/createContext')
);
const Runtime = tryRequire(
  () => require('jest/node_modules/jest-cli/node_modules/jest-runtime'),
  () => require('jest-cli/node_modules/jest-runtime'),
  () => require('jest-runtime')
);
const getTestPathPattern = tryRequire(
  () => require('jest/node_modules/jest-cli/build/lib/getTestPathPattern'),
  () => require('jest-cli/build/lib/getTestPathPattern')
);

class TestEntriesPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const options = this.options || {};

    compiler.plugin("compilation", (compilation, params) => {
      const normalModuleFactory = params.normalModuleFactory;

      compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);
    });

    compiler.plugin('make', (compilation, cb) => {
      const {jestArgv, jestConfig} = options;

      const configIgnoreJestWebpack = Object.assign({}, jestConfig.config, {
        modulePathIgnorePatterns:
          (jestConfig.config.modulePathIgnorePatterns || [])
          .concat(['/.cache/jest-webpack/']),
        testPathIgnorePatterns: jestConfig.config.testPathIgnorePatterns
          .concat(['/.cache/jest-webpack/']),
      });

      try {
        require('fs').mkdirSync(configIgnoreJestWebpack.cacheDirectory);
      }
      catch (_) {}

      Runtime.createHasteMap(configIgnoreJestWebpack).build()
      .then(hasteMap => createContext(configIgnoreJestWebpack, hasteMap))
      .then(jestContext => {
        const searchSource = new SearchSource(jestContext);
        const testPathPattern = getTestPathPattern(jestArgv);
        return searchSource.findMatchingTests(testPathPattern)
        .tests.map(test => test.path);
      })
      .then(tests => {
        options.data.reset(compilation, () => {
          cb();
        });

        tests.map(function(name) {
          const entry = resolve(compiler.options.context, name);
          options.data.compileModule(entry, entry, () => {}, true);
        });
      })
      .catch(cb);
    });
  }
}

module.exports = TestEntriesPlugin;
