const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');

class EntryReferenceTransformDependency extends ModuleDependency {
  constructor(request) {
    super(request);
  }
}

module.exports = EntryReferenceTransformDependency;
