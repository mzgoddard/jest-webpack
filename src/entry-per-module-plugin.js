const {join, relative} = require('path');

const hash = require('./hash');

const SingleEntryPlugin = require('webpack/lib/SingleEntryPlugin');

class EntryPerModulePlugin {
  addEntry(uniqueResource, context, request) {
    this.entries[uniqueResource] = [context, request];
  }

  apply(compiler) {
    compiler.plugin('compile', () => {
      this.entries = {};
    });

    compiler.plugin('make', (compilation, cb) => {
      const context = compiler.options.context;
      const modules = {};
      compilation.plugin('build-module', module => {
        if (!module.external) {return;}
        if (!this.entries[module.request]) {return;}

        const [entryContext, request] = this.entries[module.request];
        const requestParts = request.split('!');
        const loaders = requestParts.slice(0, requestParts.length - 1)
        const absoluteResource = join(
          entryContext,
          requestParts[requestParts.length - 1]
        );
        const entry = loaders.concat(absoluteResource).join('!');
        let name = relative(context, module.request);

        if (!name.endsWith('.js')) {
          name = name + '.js';
        }

        const dep = SingleEntryPlugin.createDependency(entry, name);
        modules[entry] = false;
        compilation.addEntry(entryContext, dep, name, (error, module) => {
          modules[entry] = true;
          module.name = name;
          if (Object.values(modules).reduce((carry, m) => carry && m, true)) {
            Promise.resolve()
            .then(() => cb());
          }
        });
      });
    });
  }
}

module.exports = EntryPerModulePlugin;
