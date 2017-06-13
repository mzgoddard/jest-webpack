const {dirname, relative} = require('path');

const Module = require('webpack/lib/Module');
const NullDependency = require('webpack/lib/dependencies/NullDependency');
const RawSource = require('webpack-sources/lib/RawSource');

const hash = require('./hash');

class ReferenceEntryModule extends Module {
  constructor(data, dep) {
    super();
    this.data = data;
    this.dep = dep;
    this.context = data.context;
    this.resource = data.resource;
    this.dependencies = [];
    this.built = false;
    this.cacheable = false;
    this.isSelfReference = false;
    this.selfModule = null;
  }

  get requestHash() {
    return this.data.loaders.length ? hash(this.dep.request) : 'default';
  }

  identifier() {
    return `reference ${this.resource}.${this.requestHash}`;
  }

  readableIdentifier(requestShortener) {
    return `reference ${requestShortener.shorten(this.resource)}.${this.requestHash}`;
  }

  build(options, compilation, resolver, fs, callback) {
    this.built = true;
    callback();
  }

  source() {
    if (!this._source) {
      let moduleRequire = `require(${JSON.stringify('./' + relative(this.context, this.resource))})`;
      if (this.isSelfReference) {
        moduleRequire = `__webpack_require__(${this.selfModule.id})`;
        this.dependencies.push(new NullDependency());
      }
      const moduleIdHash = JSON.stringify(this.requestHash);
      this._source = new RawSource(
        `module.exports = ${moduleRequire}[${moduleIdHash}]();`
      );
    }
    return this._source;
  }

  size() {
    return this.source().size();
  }
}

module.exports = ReferenceEntryModule;
