const {dirname} = require('path');

const RawSource = require('webpack-sources/lib/RawSource');
const Module = require('webpack/lib/Module');

const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');

const hash = require('./hash');

class EntryReferenceModule extends Module {
  constructor(resource) {
    super('javascript/auto');
    this.context = dirname(resource);
    this.resource = resource;
    this.isEntry = false;
    this.entryRequest = null;
    this.dependencies = [];
    this.built = false;
    this.cacheable = false;
  }

  identifier() {
    return `entry reference ${this.resource.split('?')[0]}`;
  }

  readableIdentifier(requestShortener) {
    return `entry reference ${requestShortener.shorten(this.resource.split('?')[0])}`;
  }

  build(options, compilation, resolver, fs, callback) {
    this.built = true;
    this.buildMeta = {providedExports: []};
    this.buildInfo = {
      cacheable: false,
      assets: [],
      dependencies: this.dependencies,
      fileDependencies: new Set,
      contextDependencies: new Set
    };
    callback();
  }

  source() {
    if (this._source) {
      return this._source;
    }

    const references = [];
    const refKeys = {};
    this.dependencies.forEach(dep => {
      if (!dep.module) {return;}
      if (dep.request.indexOf('!') === -1 && dep.request.indexOf('?') === -1) {
        if (refKeys.default) {return;}
        refKeys.default = true;
        references.push(`  default: function() {return __webpack_require__('${dep.module.id}');}`);
      }
      else {
        if (refKeys[hash(dep.request)]) {return;}
        refKeys[hash(dep.request)] = true;
        references.push(`  ${JSON.stringify(hash(dep.request))}: function() {return __webpack_require__('${dep.module.id}');}`);
      }
    });
    let rawSource = `module.exports = {\n${references.join(',\n')}\n};\n`;
    if (this.isEntry) {
      const requestHash = (
        this.entryRequest.indexOf('!') === -1 &&
        this.entryRequest.indexOf('?') === -1
      ) ?
        'default' :
        hash(this.entryRequest);
      rawSource += `module.exports[${JSON.stringify(requestHash)}]();\n`;
    }
    this._source = new RawSource(rawSource);
    return this._source;
  }

  size() {
    return this.source().size();
  }

  addData(dep) {
    const index = this.dependencies.findIndex(_dep => _dep.request === dep.request);
    if (index !== -1) {
      this.dependencies.splice(index, 1);
    }
    this.dependencies.push(dep);
  }
}

module.exports = EntryReferenceModule;
