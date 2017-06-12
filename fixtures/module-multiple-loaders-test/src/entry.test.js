var rawTests = require('raw-loader!./entry.test');

it('loads', function() {
  expect(typeof rawTests).toBe('string');
  expect(rawTests).toMatch('loads');
});
