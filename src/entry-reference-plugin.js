const {dirname, join, relative} = require('path');

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

        if (dependency instanceof EntryReferenceDependency) {
          return callback(null, options.data.entries[dependency.request]);
        }

        resolver(result, (err, data) => {
          if (err) {
            return callback(err);
          }
          if (typeof data.source === 'function') {
            return options.data.compileFile(data.resource.split('?')[0], () => {
              const dep = new EntryReferenceTransformDependency('!!' + data.request);
              // dep.userRequest = data.userRequest;
              dep.module = data;
              options.data.entries[data.resource.split('?')[0]].addData(dep);
              callback(err, data);
            });
          }

          if (dependency instanceof EntryReferenceTransformDependency) {
            return callback(null, data);
          }

          if (data.loaders.length === 0 && exclude(data.resource)) {
            const compilationDir = dirname(compilation.compiler.name);
            const compilerOutput = compiler.options.output.path;
            const compilationOutput = join(compilerOutput, compilationDir);
            const relativeResource = relative(compilationOutput, data.resource);
            return callback(err, new ExternalModule(relativeResource, 'commonjs2'));
          }

          options.data.compileModule(data.request, data.resource.split('?')[0], (err, dep) => {
            if (err) {
              return callback(err);
            }

            const shortResource = relative(compilation.compiler.options.context, data.resource.split('?')[0]);
            if (compilation.compiler.name === shortResource) {
              callback(null, data);
            }
            else {
              callback(null, new ReferenceEntryModule(data, dep));
            }
          }, data.resource.split('?')[1] === '__jest_webpack_isEntry');
        });
      });

      compilation.plugin('seal', () => {
        const entries = {};
        const refs = {};
        compilation.modules.forEach(module => {
          if (module instanceof EntryReferenceModule) {
            entries[module.resource] = module;
            if (refs[module.resource]) {
              const entryModule = module;
              refs[module.resource].map(refModule => {
                refModule.isSelfReference = true;
                refModule.selfModule = entryModule;
              });
            }

            // Ensure modules are in the compilation modules list.
            module.dependencies.forEach(dep => {
              if (compilation.modules.indexOf(dep.module) === -1) {
                dep.module = compilation.modules.find(module => (
                  module.identifier() === dep.module.identifier()
                ));
              }
            });
          }
          else if (module instanceof ReferenceEntryModule) {
            refs[module.resource] =
              (refs[module.resource] || []).concat(module);
            if (entries[module.resource]) {
              const entryModule = entries[module.resource];
              const refModule = module;
              refModule.isSelfReference = true;
              refModule.selfModule = entryModule;
            }
          }
        });
      });
    });
  }
}

module.exports = EntryReferencePlugin;
