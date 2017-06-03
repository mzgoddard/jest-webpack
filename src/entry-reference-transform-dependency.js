const ModuleDependency = require('webpack/lib/dependencies/ModuleDependency');

class EntryReferenceTransformDependency extends ModuleDependency {
  constructor(data) {
    super(data.request);
    this.data = data;
  }
}

module.exports = EntryReferenceTransformDependency;
