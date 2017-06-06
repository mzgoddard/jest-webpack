const {dirname} = require('path');

const RawSource = require('webpack-sources/lib/RawSource');
const Module = require('webpack/lib/Module');

const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');

const hash = require('./hash');

class EntryReferenceModule extends Module {
  constructor(resource) {
    super();
    this.context = dirname(resource);
    this.resource = resource;
    this.dependencies = [];
    this.built = false;
    this.cacheable = false;
  }

  identifier() {
    return `entry reference ${this.resource}`;
  }

  readableIdentifier(requestShortener) {
    return `entry reference ${requestShortener.shorten(this.resource)}`;
  }

  build(options, compilation, resolver, fs, callback) {
    this.built = true;
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
      if (dep.request.indexOf('!') === -1) {
        if (refKeys.default) {return;}
        refKeys.default = true;
        references.push(`  default: __webpack_require__(${dep.module.id})`);
      }
      else {
        if (refKeys[hash(dep.request)]) {return;}
        refKeys[hash(dep.request)] = true;
        // console.log(hash(dep.request), dep.request);
        references.push(`  ${JSON.stringify(hash(dep.request))}: __webpack_require__(${dep.module.id})`);
      }
    });
    this._source = new RawSource(`module.exports = {\n${references.join(',\n')}\n};`);
    return this._source;
  }

  size() {
    return this.source().size();
  }

  addData(dep) {
    this.dependencies.push(dep);
  }
}

module.exports = EntryReferenceModule;
