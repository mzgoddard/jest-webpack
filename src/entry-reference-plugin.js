const {dirname, relative} = require('path');

const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');

const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');
const EntryReferenceModule = require('./entry-reference-module');
const ReferenceEntryModule = require('./reference-entry-module');
const EntryReferenceDependency = require('./entry-reference-dependency');

class EntryReferencePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const options = this.options || {};
    const exclude = options.exclude || (path => /node_modules/.test(path));

    compiler.plugin('compilation', (compilation, {normalModuleFactory}) => {
      compilation.dependencyFactories.set(EntryReferenceDependency, normalModuleFactory);
      compilation.dependencyFactories.set(EntryReferenceTransformDependency, normalModuleFactory);

      const referenceModules = {};
      normalModuleFactory.plugin('resolver', resolver => (result, callback) => {
        const dependency = result.dependencies[0];
        // console.log(dependency);

        // if (dependency instanceof SingleEntryDependency) {
        //   return resolver(data, callback);
        // }
        if (dependency instanceof EntryReferenceTransformDependency) {
          return callback(null, dependency.data);
        }
        else if (dependency instanceof EntryReferenceDependency) {
          return callback(null, referenceModules[dependency.data.resource]);
        }

        resolver(result, (err, data) => {
          if (err) {
            return callback(err);
          }
          if (typeof data.source === 'function') {
            return callback(err, data);
          }

          if (exclude(data.resource)) {
            return callback(err, data);
            // return callback(err, new ExternalModule(data.request, 'commonjs2'));
          }

          if (dependency instanceof SingleEntryDependency) {
            referenceModules[data.resource] = new EntryReferenceModule(data);
            return callback(null, referenceModules[data.resource]);
          }

          if (!referenceModules[data.resource]) {
            referenceModules[data.resource] = new EntryReferenceModule(data);
            return compilation.addEntry(dirname(data.resource), new EntryReferenceDependency(data), relative(compiler.options.context, data.resource), (err, module) => {

              callback(null, new ReferenceEntryModule(data));
            });
          }
          else {
            console.log(data.request);
            const dep = new EntryReferenceTransformDependency(data);
            referenceModules[data.resource].addData(dep);
            // if (referenceModules[data.resource].built) {
              return compilation._addModuleChain(result.context, dep, module => {
                dep.module = module;
              }, (err, module) => {
                return callback(null, new ReferenceEntryModule(data));
              });
            // }
            // else {
            //   return callback(null, new ReferenceEntryModule(data));
            // }
          }
        });
      });
    });
  }
}

module.exports = EntryReferencePlugin;
