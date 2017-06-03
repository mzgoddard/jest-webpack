## Design

Plugin -> Discovers all test files, serve as the starting entries
NormalModule -> dependencies -> ReferenceEntryModule -> { if (new file) addEntry(EntryReferenceDependency) } always { NormalModule } -> EntryReferenceModule -> depends on all NormalModule with the same resource

ReferenceEntryModule - a module referring to a dynamic multi-transform entry
  e.g. module.exports = require('./hash.js').fileLoader;

EntryReferenceDependency - entry dependency to build a entry reference module
EntryReferenceModule - module exporting an object to the transformed versions of an original file inside it


