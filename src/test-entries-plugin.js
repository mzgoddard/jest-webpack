const {readFileSync} = require('fs');
const {resolve, sep} = require('path');
const mkdirp = require('mkdirp');

const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');

// Try and require jest's handling for finding source files so we can get the
// test files jest will test once the webpack step is complete.
const tryRequire = require('./try-require');
const SearchSource = tryRequire(
  () => require('jest/node_modules/jest-cli/build/search_source'),
  () => require('jest/node_modules/jest-cli/build/SearchSource'),
  () => require('jest-cli/build/search_source'),
  () => require('jest-cli/build/SearchSource')
);
const createContext = tryRequire(
  () => require('jest/node_modules/jest-cli/build/lib/create_context'),
  () => require('jest/node_modules/jest-cli/build/lib/createContext'),
  () => require('jest-cli/build/lib/create_context'),
  () => require('jest-cli/build/lib/createContext')
);
const Runtime = tryRequire(
  () => require('jest/node_modules/jest-cli/node_modules/jest-runtime'),
  () => require('jest-cli/node_modules/jest-runtime'),
  () => require('jest-runtime')
);
// const getTestPathPattern = tryRequire(
//   () => require('jest/node_modules/jest-cli/build/lib/getTestPathPattern'),
//   () => require('jest-cli/build/lib/getTestPathPattern')
// );

const modulePathIgnorePatterns = function(options) {
  if (options.jestConfig.config) {
    return options.jestConfig.config.modulePathIgnorePatterns;
  }
  else {
    return options.jestConfig.projectConfig.modulePathIgnorePatterns;
  }
};

const testPathIgnorePatterns = function(options) {
  if (options.jestConfig.config) {
    return options.jestConfig.config.testPathIgnorePatterns;
  }
  else {
    return options.jestConfig.projectConfig.testPathIgnorePatterns;
  }
};

const testPathPattern = function(options) {
  if (options.jestConfig.config) {
    const getTestPathPattern = tryRequire(
      () => require('jest/node_modules/jest-cli/build/lib/getTestPathPattern'),
      () => require('jest-cli/build/lib/getTestPathPattern')
    );
    return getTestPathPattern(options.jestArgv);
  }
  else {
    return options.jestConfig.globalConfig.testPathPattern;
  }
};

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

      const ignoreCacheJestWebpack =
        '/.cache/jest-webpack/'.replace(/\//g, sep === '\\' ? '\\\\' : sep);

      const configIgnoreJestWebpack = Object.assign(
        {},
        jestConfig.projectConfig || jestConfig.config,
        {
          modulePathIgnorePatterns:
            (modulePathIgnorePatterns(options) || [])
            .concat([ignoreCacheJestWebpack]),
          testPathIgnorePatterns: (testPathIgnorePatterns(options) || [])
            .concat([ignoreCacheJestWebpack]),
        }
      );

      try {
        mkdirp.sync(configIgnoreJestWebpack.cacheDirectory);
      }
      catch (_) {}

      Runtime.createHasteMap(configIgnoreJestWebpack).build()
      .then(hasteMap => createContext(configIgnoreJestWebpack, hasteMap))
      .then(jestContext => {
        const searchSource = new SearchSource(jestContext);
        return searchSource.findMatchingTests(testPathPattern(options))
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

        if (options.data.filesRunning === 0) {
          cb();
        }
      })
      .catch(cb);
    });
  }
}

module.exports = TestEntriesPlugin;
