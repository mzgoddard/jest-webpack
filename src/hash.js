const {createHash} = require('crypto');

var abc = 1234;

function hash(content) {
  // console.log(abc);
  // if (content === 'string') {
  //   throw new Error();
  // }
  return createHash('sha1').update(content).digest().hexSlice();
}

module.exports = hash;

// console.log(hash);

/** abc */
