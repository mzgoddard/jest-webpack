const {join, relative, resolve} = require('path');
const {readFileSync} = require('fs');

const RawSource = require('webpack-sources/lib/RawSource');

const hash = require('./hash');

class EmitChangedAssetsPlugin {
  apply(compiler) {
    // Create assets for original source files that changed.
    compiler.plugin('emit', function(compilation, cb) {
      // console.log('emit');
      const originals = {};
      const context = compiler.options.context;
      compilation.modules.forEach(module => {
        if (!module.resource) {return;}
        // console.log(module.resource, module.reasons);
        const resource = module.resource;
        let name = relative(context, resource);
        if (module.reasons[0] && module.reasons[0].dependency.loc) {
          name = module.reasons[0].dependency.loc;
        }
        if (module.name) {
          name = module.name;
        }
        if (typeof name === 'string' && resource && !originals[name]) {
          originals[name] = resource;
        }
      });

      Object.entries(originals).forEach(([name, original]) => {
        console.log('original', name);
        const assetPath = join('original', name);
        compilation.assets[assetPath] = new RawSource(readFileSync(original));
      });

      cb();
    });

    // Don't emit files that were already written correctly. That'll cause jest
    // to run them again.
    compiler.plugin('emit', function(compilation, cb) {
      Object.keys(compilation.assets).forEach(function(key) {
        try {
          var keyPath = resolve(config.output.path, key);
          var existing = readFileSync(keyPath);
          if (hash(existing) === hash(compilation.assets[key].source())) {
            delete compilation.assets[key];
          }
        }
        catch (_) {}
      });
      cb();
    });
  }
}

module.exports = EmitChangedAssetsPlugin;
