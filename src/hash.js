const {createHash} = require('crypto');

function hash(content) {
  return createHash('sha1').update(content).digest().hexSlice();
}

module.exports = hash;
