const {join} = require('path');

const EmitChangedAssetsPlugin = require('./emit-changed-assets-plugin');
const EntryPerModulePlugin = require('./entry-per-module-plugin');
const EntryReferencePlugin = require('./entry-reference-plugin');
const RunJestWhenDonePlugin = require('./run-jest-when-done-plugin');
const SharedData = require('./shared-data');
const TestEntriesPlugin = require('./test-entries-plugin');

const hash = require('./hash');

class JestWebpackPlugin {
  constructor(options) {
    this.options = options || {};
  }

  // externals: Treat dependencies that match any test in this option as
  // external to the chunk being built. Being external they need to be a script
  // as their own chunk or not need webpack to handle them.
  externals(context, depRequest, cb) {
    const request = typeof depRequest === 'string' ? depRequest : depRequest.rawRequest;
    const requestParts = request.split('!');
    const resource = requestParts[requestParts.length - 1];

    // // Inline modules with full path requests. As the jest script sets entry to
    // // full path requests, this will let us build those modules. Any other
    // // modules must be built as another entry or not require webpack work.
    // if (/^\//.test(resource)) {
    //   return cb(null);
    // }
    // // Any relative requests (e.g. ./app-card) are external and must be built as
    // // their own entry/chunk.
    // if (/^\./.test(resource)) {
    //   const absoluteResource = path.resolve(context, resource);
    //   let hashedRequest = '';
    //   if (requestParts.length > 1) {
    //     hashedRequest = `.loader-${hash(JSON.stringify([context, request]))}`;
    //   }
    //   const uniqueResource = `${absoluteResource}${hashedRequest}`;
    //   this.entryPerModule.addEntry(uniqueResource, context, request);
    //   return cb(null, uniqueResource, 'commonjs2');
    // }
    if (/^\w/.test(resource)) {
      // All other modules are expected to not need webpack work and come from
      // node_modules (e.g. react).
      cb(null, request, 'commonjs2');
    }
    else {
      cb(null);
    }
  }

  apply(compiler) {
    compiler.options.entry = {};
    compiler.options.output.path = this.options.path ||
      join(compiler.options.context, '.cache/jest-webpack');
    compiler.options.output.filename = '[name]';
    // Need an appropriate libraryTarget to get the output from a built module.
    compiler.options.output.libraryTarget = 'commonjs2';
    // Jest is going to require files like in node. The output chunks need to
    // module.exports their entry module.
    compiler.options.target = 'node';
    // compiler.options.externals = this.externals.bind(this);

    const shared = new SharedData();

    new EmitChangedAssetsPlugin().apply(compiler);
    new EntryReferencePlugin({data: shared}).apply(compiler);
    // this.entryPerModule = new EntryPerModulePlugin();
    // this.entryPerModule.apply(compiler);
    new RunJestWhenDonePlugin().apply(compiler);
    new TestEntriesPlugin({data: shared}).apply(compiler);
  }
}

module.exports = JestWebpackPlugin;
