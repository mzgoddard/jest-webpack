if (__resourceQuery) {
  module.exports = __resourceQuery;
}
else {
  it('has variables', function() {
    expect(require('./entry?query')).toBe('?query');
    expect(require('./entry?query2')).toBe('?query2');
    expect(require('./entry.test?query3')).toBe('?query3');
  });
}
