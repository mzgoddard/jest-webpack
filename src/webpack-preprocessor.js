// webpack-preprocessor.js
'use strict';

var path = require('path');

var root = process.cwd();

module.exports = {
  canInstrument: true,
  process(src, filename) {
    // console.log(filename);
    if (/node_modules/.test(filename)) {
      return src;
    }
    // if (/\.cache\/jest\/original/.test(filename)) {
    //   filename = path.relative(path.join(root, '.cache/jest/original'), filename);
    //   filename = path.resolve(root, '.cache/jest/webpack', filename);
    //   return require('fs').readFileSync(filename, 'utf8');
    // }
    filename = path.join(root, '../webpack', path.relative(root, filename));
    return require('fs').readFileSync(filename, 'utf8');
    // if (!/\.cache\/jest\/webpack/.test(filename)) {
    //   filename = path.relative(root, filename);
    //   filename = path.resolve(root, '../webpack', filename);
    //   return require('fs').readFileSync(filename, 'utf8');
    // }
    return src;
  },
};
