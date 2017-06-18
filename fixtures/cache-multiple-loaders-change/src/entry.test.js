var entry = require("./entry");

it("loads", function() {
  expect(entry).toBeInstanceOf(Function);
  expect(entry(3)).toBe(6);
});