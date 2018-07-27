// require('source-map-support').install({hookRequire: true});

const utils = require('../fixtures/utils');

const itCaches = (fixture, file) => {
  it(`caches "${fixture}"`, () => {
    return utils.run(fixture)
    .then(utils.itBuilt([file]))
    .then(utils.itTests([file]))
    .then(utils.itPasses)
    .then(utils.runAgain)
    .then(utils.didNotBuild([file]))
    .then(utils.itTests([file]))
    .then(utils.itPasses);
  }, 30000);
};

const itCachesChange = (fixture, {built, notBuilt, tests, filesA, filesB}) => {
  it(`caches and builds changes "${fixture}"`, () => {
    return utils.willRun(fixture)
    .then(utils.clean)
    .then(utils.writeFiles(filesA))
    .then(utils.runAgain)
    .then(utils.itBuilt([built, notBuilt].filter(Boolean)))
    .then(utils.itTests([tests].filter(Boolean)))
    .then(utils.itPasses)
    .then(utils.writeFiles(filesB))
    .then(utils.runAgain)
    .then(utils.itBuilt([built].filter(Boolean)))
    .then(utils.didNotBuild([notBuilt].filter(Boolean)))
    .then(utils.itTests([tests].filter(Boolean)))
    .then(utils.itPasses);
  }, 30000);
};

itCaches('module-blocks', 'src/entry.test.js');
itCaches('module-multiple-loaders', 'src/entry.test.js');
itCaches('module-multiple-loaders-test', 'src/entry.test.js');
itCaches('module-recursive', 'src/entry.test.js');
itCaches('module-variables', 'src/entry.test.js');
itCaches('test-entries-src', 'src/entry.test.js');
itCaches('test-entries-src-babel', 'src/entry.test.js');

itCachesChange('cache-blocks-change', {
  built: 'src/entry.js',
  notBuilt: 'src/entry.test.js',
  tests: 'src/entry.test.js',
  filesA: {
    'src/entry.js': [
      'var fact = function(n) {',
      '  return n > 0 ? fact(n - 1) + n : 0;',
      '};',
      '',
      'module.exports = fact;',
    ],
  },
  filesB: {
    'src/entry.js': [
      'var fact2 = function(n) {',
      '  return n > 0 ? fact2(n - 1) + n : 0;',
      '};',
      '',
      'module.exports = fact2;',
    ],
  },
});

itCachesChange('cache-multiple-loaders-change', {
  built: 'src/entry.js',
  tests: 'src/entry.test.js',
  filesA: {
    'src/entry.test.js': [
      'var entry = require("./entry");',
      '',
      'it("loads", function() {',
      '  expect(entry).toBeInstanceOf(Function);',
      '  expect(entry(3)).toBe(6);',
      '});',
    ],
  },
  filesB: {
    'src/entry.test.js': [
      'var entry = require("./entry");',
      'var rawEntry = require("raw-loader!./entry");',
      '',
      'it("loads", function() {',
      '  expect(entry).toBeInstanceOf(Function);',
      '  expect(entry(3)).toBe(6);',
      '  expect(typeof rawEntry).toBe("string");',
      '  expect(rawEntry).toMatch("var fact");',
      '});',
    ],
  },
});
