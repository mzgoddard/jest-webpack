var join = require('path').join;
var readFileSync = require('fs').readFileSync;

var babel = require('babel-core');

try {
  var code = babel.transform(
    readFileSync(join(__dirname, 'worker.js'), 'utf8'),
    {presets: [['env', {targets: {node: 4}}]]}
  ).code;
}
catch (err) {
  console.error(err.stack || err);
  throw err;
}

eval(code);
