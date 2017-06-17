require('source-map-support').install({hookRequire: true});

const utils = require('../fixtures/utils');

it('builds multiple versions of a dependency', () => {
  return utils.run('module-multiple-loaders')
  .then(utils.itBuilt(['src/entry.js']))
  .then(utils.itTests(['src/entry.test.js']))
  .then(utils.itPasses);
}, 30000);

it('builds multiple versions of a test file', () => {
  return utils.run('module-multiple-loaders-test')
  .then(utils.itBuilt(['src/entry.test.js']))
  .then(utils.itTests(['src/entry.test.js']))
  .then(utils.itPasses);
}, 30000);

it('builds chunks ensured by a test file', () => {
  return utils.run('module-blocks')
  .then(utils.itBuilt(['src/entry.test.js']))
  .then(utils.itTests(['src/entry.test.js']))
  .then(utils.itPasses);
}, 30000);

it('builds variables in a test file', () => {
  return utils.run('module-variables')
  .then(utils.itBuilt(['src/entry.test.js']))
  .then(utils.itTests(['src/entry.test.js']))
  .then(utils.itPasses);
}, 30000);
