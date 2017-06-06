require('source-map-support').install({hookRequire: true});

// console.log('pre-hash');

const hash = require('./hash');
const _hash = require('file-loader!./hash');
require('file-loader!../webpack.config.js');

const abc = 12345678901;

// console.log(hash);

describe('hash', () => {
  it('hashes a string', () => {
    // console.log(abc);
    expect(typeof hash('string')).toBe('string');
    expect(hash('string')).toBe('ecb252044b5ea0f679ee78ec1a12904739e2904d');
  });
});

// console.log(abc);

it('fails', () => {
  // throw new Error();
});
