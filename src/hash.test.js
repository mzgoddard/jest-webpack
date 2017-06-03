require('source-map-support').install({hookRequire: true});

const hash = require('./hash');
const _hash = require('file-loader!./hash');
require('file-loader!../webpack.config.js');

const abc = 123;

// console.log(hash);

describe('hash', () => {
it('hashes a string', () => {
  // throw new Error();
  // require('./hash')('string');
  // const hash = () => {};
  // expect(hash).toBeInstanceOf(Function);
  console.log(hash('string'));
});
});
