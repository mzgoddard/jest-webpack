const {basename, join} = require('path');
const {readdir, readFile, stat} = require('fs');

const pify = require('pify');
const nodeObjectHash = require('node-object-hash');

const hash = require('./hash');

const fileHash = file => pify(readFile)(file).then(hash);

const contextHash = (dir, _contextHash = contextHash) => {
  return pify(readdir)(dir)
  .then(names => {
    return Promise.all(names.map(name => {
      const fullpath = join(dir, name);
      return pify(stat)(fullpath)
      .then(stat => {
        if (stat.isDirectory()) {
          return _contextHash(fullpath);
        }
        else {
          return fileHash(fullpath);
        }
      });
    }));
  })
  .then(hashes => hashes.filter(Boolean))
  .then(hashes => hashes.reduce((carry, value) => hash(carry + value)));
};

const depsContextHash = dir => {
  return contextHash(dir, dir => (
    basename(dir).startsWith('.') ?
      null :
      pify(stat)(join(dir, 'package.json'))
      .then(() => fileHash(join(dir, 'package.json')))
      .catch(() => contextHash(dir, dir => hash(dir)))
  ));
};

const configHash = config => {
  return nodeObjectHash({sort: false}).hash(config);
};

module.exports = {
  configHash,
  contextHash,
  depsContextHash,
  fileHash,
};
