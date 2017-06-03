const {dirname} = require('path');

const RawSource = require('webpack-sources/lib/RawSource');
const Module = require('webpack/lib/Module');

const EntryReferenceTransformDependency = require('./entry-reference-transform-dependency');

const hash = require('./hash');

class EntryReferenceModule extends Module {
  constructor(data) {
    super();
    this.context = dirname(data.resource);
    this.resource = data.resource;
    this.dependencies = [new EntryReferenceTransformDependency(data)];
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
    this.dependencies.forEach(dep => {
      console.log(dep.data.resource, !!dep.module);
      if (!dep.module) {return;}
      if (dep.data.request.indexOf('!') === -1) {
        references.push(`  default: __webpack_require__(${dep.module.id})`);
      }
      else {
        references.push(`  ${JSON.stringify(hash(dep.data.request))}: __webpack_require__(${dep.module.id})`);
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
