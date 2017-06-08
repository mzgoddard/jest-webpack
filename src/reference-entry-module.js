const {dirname, relative} = require('path');

const RawSource = require('webpack-sources/lib/RawSource');
const Module = require('webpack/lib/Module');

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
    this.cacheable = true;
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
    return new RawSource(`module.exports = require(${JSON.stringify('./' + relative(this.context, this.resource))})[${JSON.stringify(this.requestHash)}];`);
  }

  size() {
    return this.source().size();
  }
}

module.exports = ReferenceEntryModule;
