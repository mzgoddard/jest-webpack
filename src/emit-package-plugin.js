const {join, relative, resolve} = require('path');

const pify = require('pify');
const RawSource = require('webpack-sources/lib/RawSource');

const hash = require('./hash');

class EmitPackagePlugin {
  apply(compiler) {
    const config = compiler.options;

    compiler.plugin('make', (compilation, cb) => {
      const inputFileSystem = compilation.inputFileSystem;
      const readFile = inputFileSystem.readFile.bind(inputFileSystem);
      pify(readFile)(join(config.context, 'package.json'))
      .then(src => {
        compilation.assets['package.json'] = new RawSource(src);
        cb();
      })
      .catch(cb);
    });
  }
}

module.exports = EmitPackagePlugin;
