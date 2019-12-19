const {run, itBuilt, didNotBuild, itTests, itSkips, containsOutput, itPasses, itFails} =
  require('../fixtures/utils');

it('--bail', () => {
  return run('flags-bail', ['--bail'])
  .then(itBuilt(['src/entry.test.js']))
  .then(containsOutput([' failed, ']))
  .then(itFails);
}, 30000);

it('--testMatch', () => {
  return run('flags-testMatch', ['--testMatch', '**/src/entry.test{,2}.js'])
  .then(itBuilt(['src/entry.test.js', 'src/entry.test2.js']))
  .then(itPasses);
}, 30000);

it('--testNamePattern', () => {
  return run('flags-testNamePattern', ['--testNamePattern', 'entry2', '--testPathPattern', 'entry2'])
  .then(itTests(['entry2']))
  .then(itSkips(['entry1']))
  .then(itPasses);
}, 30000);

it('--testPathPattern', () => {
  return run('flags-testPathPattern', ['--testPathPattern', 'entry1.test'])
  .then(didNotBuild(['src/entry2.test.js']))
  .then(itTests(['entry1']))
  .then(itSkips(['entry2']))
  .then(itPasses);
}, 30000);

it('--testRegex', () => {
  return run('flags-testRegex', ['--testRegex', '/entry\\.test'])
  .then(itBuilt(['src/entry.test.js', 'src/entry.test2.js']))
  .then(itPasses);
}, 30000);
