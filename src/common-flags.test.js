const {run, itBuilt, itSkips} = require('../fixtures/utils');

it('--bail', () => {
  return run('flags-bail', ['--bail'])
  .then(itBuilt(['src/entry.test.js']))
  .then(itSkips(['passes']));
}, 30000);
