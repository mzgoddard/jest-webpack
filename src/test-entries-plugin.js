const {readFileSync} = require('fs');
const {resolve} = require('path');

const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');
const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

class TestEntriesPlugin {
  apply(compiler) {
    compiler.plugin("compilation", (compilation, params) => {
      const normalModuleFactory = params.normalModuleFactory;

      compilation.dependencyFactories.set(SingleEntryDependency, normalModuleFactory);
    });

    compiler.plugin('make', (compilation, cb) => {
      var tests;
      try {
        var jestinclude = readFileSync('.jestinclude', 'utf8');
        tests = [].concat.apply(
          [],
          jestinclude
          .split('\n')
          .map(function(include) {
            if (/^\s*#/.test(include)) {return;}
            if (/^\s*$/.test(include)) {return;}
            return require('glob').sync(include, {
              cwd: compiler.options.context,
              ignore: ['**/node_modules/**', '**/tmp/**', '**/dist/**'],
            });
          })
          .filter(Boolean)
        );
      }
      catch (err) {
        tests = require('glob').sync('{__tests__/**/*.js,src/**/*.test.js}', {
          cwd: compiler.options.context,
        });
      }

      // console.log(tests);

      Promise.all(tests.map(function(name) {
        const entry = resolve(compiler.options.context, name);
        const dep = SingleEntryPlugin.createDependency(entry, name);
        // console.log(compiler.options.context, dep);
        return new Promise((resolve, reject) => {
          compilation.addEntry(compiler.options.context, dep, name, (err, module) => {
            // console.log('complete', err, module);
            if (err) {return reject(err);}
            else {return resolve();}
          });
        });
      }, {}))
      .then(() => cb(), cb);
    });
  }
}

module.exports = TestEntriesPlugin;
