const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');

class EntryReferenceDependency extends ModuleDependency {
  constructor(data, name) {
    super(data.request);
    this.data = data;
    this.name = name;
  }
}

module.exports = EntryReferenceDependency;
