const {run, itBuilt, itSkips} = require('../fixtures/utils');

it('bail', () => {
  return run('config-bail')
  .then(itBuilt(['src/entry.test.js']))
  .then(itSkips(['passes']));
}, 30000);
