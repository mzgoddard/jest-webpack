// require('source-map-support').install({hookRequire: true});

const hash = require('./hash');

describe('hash', () => {
  it('hashes a string', () => {
    expect(typeof hash('string')).toBe('string');
    expect(hash('string')).toBe('ecb252044b5ea0f679ee78ec1a12904739e2904d');
  });
});
