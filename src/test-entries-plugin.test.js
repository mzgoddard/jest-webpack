require('source-map-support').install({hookRequire: true});

const utils = require('../fixtures/utils');

it('detects in src', () => {
  return utils.run('test-entries-src')
  .then(utils.itPasses)
  .then(utils.itBuilt(['src/entry.test.js']))
  .then(utils.itTests(['src/entry.test.js']));
}, 30000);

it('detects in src - babel', () => {
  return utils.run('test-entries-src-babel')
  .then(utils.itPasses)
  .then(utils.itBuilt(['src/entry.test.js']))
  .then(utils.itTests(['src/entry.test.js']));
}, 30000);
