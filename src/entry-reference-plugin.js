const {dirname, relative} = require('path');

const SingleEntryDependency = require('webpack/lib/dependencies/SingleEntryDependency');
const ExternalModule = require('webpack/lib/ExternalModule');

const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');
const EntryReferenceModule = require('./entry-reference-module');
const ReferenceEntryModule = require('./reference-entry-module');
const EntryReferenceDependency = require('./entry-reference-dependency');

const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');

class EntryReferencePlugin {
  constructor(options) {
    this.options = options;
  }

  apply(compiler) {
    const options = this.options || {};
    const exclude = options.exclude || (path => /node_modules/.test(path));

    let topCompilation;

    compiler.plugin('this-compilation', compilation => {
      topCompilation = compilation;
    });

    compiler.plugin('compilation', (compilation, {normalModuleFactory}) => {
      compilation.dependencyFactories.set(EntryReferenceDependency, normalModuleFactory);
      compilation.dependencyFactories.set(EntryReferenceTransformDependency, normalModuleFactory);

      normalModuleFactory.plugin('before-resolve', (data, callback) => {
        if (typeof data.request === 'object') {
          data.request = data.rawRequest;
        }
        callback(null, data);
      });

      normalModuleFactory.plugin('resolver', resolver => (result, callback) => {
        const dependency = result.dependency || result.dependencies[0];

        // if (dependency instanceof EntryReferenceTransformDependency) {
        //   return callback(null, dependency.request);
        // }
        if (dependency instanceof EntryReferenceDependency) {
          return callback(null, options.data.entries[dependency.request]);
        }

        resolver(result, (err, data) => {
          if (err) {
            return callback(err);
          }
          if (typeof data.source === 'function') {
            return callback(err, data);
          }

          if (dependency instanceof EntryReferenceTransformDependency) {
            return callback(null, data);
          }

          if (data.loaders.length === 0 && exclude(data.resource)) {
            // return callback(err, data);
            return callback(err, new ExternalModule(data.rawRequest, 'commonjs2'));
          }

          // if (dependency instanceof SingleEntryDependency) {
          //   referenceModules[data.resource] = new EntryReferenceModule(data);
          //   return callback(null, referenceModules[data.resource]);
          // }

          options.data.compileModule(data.request, data.resource, (err, dep) => {
            callback(null, new ReferenceEntryModule(data, dep));
          });
        });
      });
    });
  }
}

module.exports = EntryReferencePlugin;
