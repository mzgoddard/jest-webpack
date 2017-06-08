const {dirname, relative} = require('path');

const NodeTemplatePlugin = require('webpack/lib/node/NodeTemplatePlugin');
const NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
const LibraryTemplatePlugin = require('webpack/lib/LibraryTemplatePlugin');

const EntryReferenceModule = require('./entry-reference-module');
const EntryReferenceDependency = require('./entry-reference-dependency');
const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');

class SharedData {
  constructor() {
    this.compilation = null;
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

  startFile(resource) {
    this.filesRunning++;
  }

  completeFile(resource, error) {
    this.filesCompleted++;

    if (this.filesCompleted == this.filesRunning) {
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
      [
        new NodeTemplatePlugin({
          asyncChunkLoading: false,
        }),
        new NodeTargetPlugin(),
        new LibraryTemplatePlugin(this.compilation.compiler.options.output.library, this.compilation.compiler.options.output.libraryTarget, this.compilation.compiler.options.output.umdNamedDefine, this.compilation.compiler.options.output.auxiliaryComment || ""),
        {
          apply(compiler) {
            compiler.plugin('this-compilation', compilation => {
              _this.compilations[resource] = compilation;

              if (compilation.cache) {
                if (!compilation.cache[name]) {
                  compilation.cache[name] = {};
                }
                compilation.cache = compilation.cache[name];
              }
            });

            compiler.plugin('make', (compilation, cb) => {
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

  compileModule(request, resource, callback) {
    this.compileFile(resource, () => {
      if (!this.modules[request]) {
        this.startModule(request);

        const dep = new EntryReferenceTransformDependency(request);
        this.entries[resource].addData(dep);

        this.compilations[resource]
        ._addModuleChain(dirname(resource), dep, module => {
          dep.module = module;
          dep.request = module.request;
        }, (err, module) => {
          this.completeModule(request, err);
        });

        callback(null, dep);
      }
    });
  }

  // compileDependency(dep) {
  //
  // }
}

module.exports = SharedData;
