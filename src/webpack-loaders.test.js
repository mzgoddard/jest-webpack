const {run, itBuilt, didNotBuild, itTests, itSkips, itPasses, itFails} =
  require('../fixtures/utils');

it('works with style+css loaders', () => {
  return run('loader-css')
  .then(itBuilt(['src/entry.css', 'src/entry.test.js']))
  .then(itPasses);
}, 30000);
