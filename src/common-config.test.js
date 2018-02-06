const {run, itBuilt, itSkips, containsOutput, itPasses, itFails} = require('../fixtures/utils');

it('bail', () => {
  return run('config-bail')
  .then(itBuilt(['src/entry.test.js']))
  .then(containsOutput(' failed, '))
  .then(itFails);
}, 30000);

it('testMatch', () => {
  return run('config-testMatch')
  .then(itBuilt(['src/entry.test.js', 'src/entry.test2.js']))
  .then(itPasses);
}, 30000);
