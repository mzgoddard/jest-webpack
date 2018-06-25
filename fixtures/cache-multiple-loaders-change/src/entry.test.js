var entry = require("./entry");
var rawEntry = require("raw-loader!./entry");

it("loads", function() {
  expect(entry).toBeInstanceOf(Function);
  expect(entry(3)).toBe(6);
  expect(typeof rawEntry).toBe("string");
  expect(rawEntry).toMatch("var fact");
});