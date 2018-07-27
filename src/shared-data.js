const {basename, dirname, join, relative, sep} = require('path');

const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');

const EntryReferenceModule = require('./entry-reference-module');
const EntryReferenceDependency = require('./entry-reference-dependency');
const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');

class SharedData {
  constructor() {
    this.compilation = null;
    this.manifest = null;
    this.fulfilledManifest = null;
    this.entries = {};
    this.modules = {};
    this.compilations = {};
    this.modulesRunning = 0;
    this.modulesCompleted = 0;
    this.entriesRunning = 0;
    this.entriesCompleted = 0;
    this.filesRunning = 0;
    this.filesCompleted = 0;
    this.fileCallbacks = {};
    this.fileErrors = {};
    this.entryCallbacks = {};
    this.entryErrors = {};
    this.entryCompleted = {};
    this.entryCompletedCallbacks = {};
    this.moduleErrors = {};
    this.onComplete = () => {};
  }

  reset(compilation, onComplete) {
    this.compilation = compilation;
    this.entries = {};
    this.modules = {};
    this.compilations = {};
    this.modulesRunning = 0;
    this.modulesCompleted = 0;
    this.entriesRunning = 0;
    this.entriesCompleted = 0;
    this.filesRunning = 0;
    this.filesCompleted = 0;
    this.fileCallbacks = {};
    this.fileErrors = {};
    this.entryCallbacks = {};
    this.entryErrors = {};
    this.entryCompleted = {};
    this.entryCompletedCallbacks = {};
    this.moduleErrors = {};
    this.onComplete = onComplete;
  }

  setManifest(manifest) {
    this.manifest = manifest;
    this.fulfilledManifest = {};
  }

  startFile(resource) {
    this.filesRunning++;
  }

  completeFile(resource, error) {
    this.filesCompleted++;

    if (
      this.filesCompleted == this.filesRunning &&
      this.fulfilledManifest &&
      this.manifest
    ) {
      for (const key in this.fulfilledManifest) {
        const item = this.fulfilledManifest[key];
        const oldItem = this.manifest[key];
        // item && item.transforms.sort();
        // oldItem && oldItem.transforms.sort();
        if (
          item && oldItem &&
          item.transforms.length < oldItem.transforms.length
          // (
          //   item.transforms.length !== oldItem.transforms.length ||
          //   oldItem.transforms.some(t => !item.transforms.find(_t => (
          //     _t.request === t.request &&
          //     _t.isEntry === t.isEntry
          //   )))
          // )
        ) {
          // console.log('smaller file', key, item.transforms.length, oldItem.transforms.length);
          this.manifest[key] = null;
          for (const index in oldItem.transforms) {
            // this.compileModule(oldItem.transforms[index], key, () => {});
          }
        }
      }
    }
    if (this.filesCompleted == this.filesRunning) {
      // this.manifest &&
      //   console.log(
      //     Object.keys(this.manifest)
      //     .filter(key => this.manifest[key]),
      //     this.filesCompleted
      //   );
      this.onComplete();
    }
  }

  startEntry(resource, callback) {
    this.entryCallbacks[resource] = callback;
    this.entriesRunning++;
  }

  completeEntry(resource, error) {
    this.entryErrors[resource] = error;
    this.entryCompleted[resource] = true;
    this.entriesCompleted++;

    if (this.entryCompletedCallbacks[resource]) {
      this.entryCompletedCallbacks[resource].forEach(cb => cb());
    }

    this.checkCompletion();
  }

  startModule(request) {
    this.modulesRunning++;
  }

  completeModule(request, error) {
    this.moduleErrors[request] = error;
    this.modulesCompleted++;

    this.checkCompletion();
  }

  checkCompletion() {
    if (
      this.modulesRunning === this.modulesCompleted &&
      this.entriesCompleted === this.entriesRunning
    ) {
      for (let key in this.entryCallbacks) {
        this.entryCallbacks[key](this.entryErrors[key]);
      }
    }
  }

  compileFile(resource, callback) {
    if (this.entryCompleted[resource]) {
      return callback();
    }

    if (!this.entryCompletedCallbacks[resource]) {
      this.entryCompletedCallbacks[resource] = [];
    }
    this.entryCompletedCallbacks[resource].push(callback);

    if (!this.compilations[resource]) {
      const shortResource = relative(this.compilation.compiler.options.context, resource);
      this.startFile(resource);

      this.entries[resource] = new EntryReferenceModule(resource);

      const _this = this;

      const child = this.compilation.compiler.createChildCompiler(this.compilation, shortResource);
      child.records = this.compilation.compiler.records[shortResource][0];
      [
        new NodeTemplatePlugin({
          asyncChunkLoading: false,
        }),
        new NodeTargetPlugin(),
        new LibraryTemplatePlugin(this.compilation.compiler.options.output.library, this.compilation.compiler.options.output.libraryTarget, this.compilation.compiler.options.output.umdNamedDefine, this.compilation.compiler.options.output.auxiliaryComment || ""),
        {
          apply(compiler) {
            compiler.plugin('this-compilation', compilation => {
              compilation.plugin('optimize-assets', (assets, cb) => {
                Object.keys(assets).forEach(key => {
                  const newKey = join(dirname(shortResource), basename(key));
                  if (newKey === key) {return;}
                  assets[newKey] = assets[key];
                  delete assets[key];
                });
                cb();
              });
            });

            compiler.plugin('make', (compilation, cb) => {
              // Store compilation to add transforms to later.
              _this.compilations[resource] = compilation;

              // Use or create a cache for this compilation in the parent cache.
              if (compilation.cache) {
                if (!compilation.cache[shortResource]) {
                  compilation.cache[shortResource] = {};
                }
                compilation.cache = compilation.cache[shortResource];
              }

              _this.startEntry(resource, cb);
              return compilation.addEntry(
                // context
                dirname(resource),
                // dependency
                new EntryReferenceDependency(resource),
                // compilation name
                shortResource,
                (err, module) => {
                  // The callback will be called when all modules have been
                  // built.
                  _this.completeEntry(resource, err);
                }
              );
            });
          },
        },
      ].forEach(plugin => plugin.apply(child));
      child.runAsChild(err => {
        this.completeFile(resource, err);
      });
    }
  }

  compileModule(request, resource, callback, isEntry = false) {
    this.modules[request] = true;

    if (
      this.manifest &&
      this.manifest[resource] &&
      (
        this.manifest[resource].transforms
        .findIndex(transform => (
          transform.request === request && transform.isEntry === isEntry
        )) !== -1
      )
    ) {
      this.fulfilledManifest[resource] = this.fulfilledManifest[resource] || {
        transforms: [],
      };
      this.fulfilledManifest[resource].transforms.push({
        request,
        resource,
        isEntry,
      });

      this.manifest[resource].transforms
      .find(transform => transform.request === request)
      .dependencies.forEach(dep => {
        const depSplit = dep.split('!');
        const resource = depSplit[depSplit.length - 1];

        // Stop modules from recursively looping at this point.
        if (!this.modules[dep]) {
          this.compileModule(dep, resource.split('?')[0], () => {}, resource.split('?')[1] === '__jest_webpack_isEntry');
        }
      });

      return callback(null, {
        request: request,
      });
    }

    if (this.manifest && this.manifest[resource]) {
      this.manifest[resource] = null;

      if (this.fulfilledManifest && this.fulfilledManifest[resource]) {
        this.fulfilledManifest[resource].transforms
        .forEach(({request, resource, isEntry}) => {
          this.compileModule(request, resource, () => {}, isEntry);
        });
        this.fulfilledManifest[resource] = null;
      }
    }

    this.compileFile(resource, () => {
      this.startModule(request);

      const dep = new EntryReferenceTransformDependency(
        (isEntry ? '' : '!!') + request
      );

      this.compilations[resource]
      ._addModuleChain(dirname(resource), dep, module => {
        dep.module = module;
        dep.request = module.request;

        this.entries[resource].addData(dep);
        if (isEntry) {
          this.entries[resource].isEntry = true;
          this.entries[resource].entryRequest = module.request;
        }
      }, (err, module) => {
        this.completeModule(request, err);
      });

      callback(null, dep);
    }, isEntry);
  }

  // compileDependency(dep) {
  //
  // }
}

module.exports = SharedData;
