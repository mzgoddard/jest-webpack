it('async loads', function() {
  return new Promise(resolve => {
    require.ensure([], function(require) {
      resolve(require('./entry'));
    });
  })
  .then(function(entry) {
    expect(entry).toBeInstanceOf(Function);
    expect(entry(3)).toBe(6);
  });
});
