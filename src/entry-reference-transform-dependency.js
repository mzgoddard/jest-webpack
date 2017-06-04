const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');

class EntryReferenceTransformDependency extends ModuleDependency {
  constructor(data) {
    super(data);
  }
}

module.exports = EntryReferenceTransformDependency;
