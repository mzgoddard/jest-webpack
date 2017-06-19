var entry = require('./entry.css');
var entryCss = require('!!css-loader!./entry.css');

it('loads', function() {
  expect(entry).toBeTruthy();
  expect('' + entryCss).toContain('.entry');
});
