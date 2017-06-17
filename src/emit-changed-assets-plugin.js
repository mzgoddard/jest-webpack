const {join, relative, resolve} = require('path');
const {readFileSync} = require('fs');

const RawSource = require('webpack-sources/lib/RawSource');

const hash = require('./hash');

class EmitChangedAssetsPlugin {
  apply(compiler) {
    const config = compiler.options;

    // Don't emit files that were already written correctly. That'll cause jest
    // to run them again.
    compiler.plugin('emit', function(compilation, cb) {
      try {
        Object.keys(compilation.assets).forEach(function(key) {
          try {
            var keyPath = resolve(config.output.path, key);
            var existing = readFileSync(keyPath);
            if (hash(existing) === hash(compilation.assets[key].source())) {
              delete compilation.assets[key];
            }
          }
          catch (err) {}
        });
      }
      catch (err) {
        return cb(err);
      }
      cb();
    });
  }
}

module.exports = EmitChangedAssetsPlugin;
