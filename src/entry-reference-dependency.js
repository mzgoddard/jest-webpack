const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');

class EntryReferenceDependency extends ModuleDependency {
  constructor(resource) {
    super(resource);
  }
}

module.exports = EntryReferenceDependency;
