const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');

class EntryReferenceDependency extends ModuleDependency {
  constructor(data) {
    super(data);
  }
}

module.exports = EntryReferenceDependency;
