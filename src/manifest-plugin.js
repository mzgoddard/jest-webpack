const {join} = require('path');

const pify = require('pify');
const RawSource = require('webpack-sources/lib/RawSource');

const hash = require('./hash');
const ReferenceEntryModule = require('./reference-entry-module');
const {configHash, contextHash, depsContextHash, fileHash} =
  require('./file-hash');

const hashMembers = (members, memberHash) => {
  return Promise.all(Array.from(members).map(memberHash))
    .then(hashes => hashes.reduce((carry, value) => hash(carry + value), ''));
};

class ManifestPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const options = this.options;
    const _configHash = configHash(compiler.options);

    const manifestPath = join(compiler.options.context, '.cache/jest-webpack/manifest.json');
    const depsDirs = [join(compiler.options.context, 'node_modules')];
    const depsHash = Promise.all(depsDirs.map(depsContextHash))
    .catch(() => [''])
    .then(hashes => hashes.reduce((carry, value) => hash(carry + value)));

    compiler.plugin(['watch-run', 'run'], (compiler, cb) => {
      const inputFileSystem = compiler.inputFileSystem;
      const readFile = inputFileSystem.readFile.bind(inputFileSystem);
      const manifest = pify(readFile)(manifestPath)
      .then(file => file.toString())
      .catch(() => '{}')
      .then(JSON.parse);
      Promise.all([manifest, depsHash])
      .then(([manifest, depsHash]) => {
        return Promise.all(
          Object.keys(manifest)
          .filter(resource => !resource.startsWith('__'))
          .map(resource => {
            return Promise.all([
              pify(readFile)(join(compiler.options.context, '.cache/jest-webpack', resource))
              .then(hash)
              .catch(() => ''),
              hashMembers(manifest[resource].fileDependencies || manifest[resource].buildInfo.fileDependencies || [], fileHash),
              hashMembers(manifest[resource].contextDependencies || manifest[resource].buildInfo.contextDependencies || [], contextHash),
            ])
            .then(([hash, fileHash, contextHash]) => {
              if (
                manifest[resource].hash === hash &&
                manifest[resource].fileHash === fileHash &&
                manifest[resource].contextHash === contextHash
              ) {
                return {
                  resource: join(compiler.options.context, resource),
                  transforms: manifest[resource].transforms,
                };
              }
            });
          })
        )
        .then(entries => entries.filter(Boolean))
        .then(entries => {
          const _manifest = {
            __depsHash: manifest.__depsHash,
            __configHash: manifest.__configHash,
          };
          entries.forEach(entry => {
            _manifest[entry.resource] = entry;
          });
          return [_manifest, depsHash];
        });
      })
      .then(([manifest, depsHash]) => {
        if (
          manifest.__depsHash !== depsHash ||
          manifest.__configHash !== _configHash
        ) {
          options.data.setManifest(null);
          return cb();
        }

        options.data.setManifest(manifest);
        // options.data.setManifest(null);
        cb();
      })
      .catch(err => {console.error(err); throw err;})
      .catch(cb);
    });

    compiler.plugin('emit', (compilation, cb) => {
      const inputFileSystem = compilation.inputFileSystem;
      const readFile = inputFileSystem.readFile.bind(inputFileSystem);
      pify(readFile)(manifestPath)
      .then(file => file.toString())
      .catch(() => '{}')
      .then(JSON.parse)
      .then(manifest => {
        return Promise.all(compilation.children.map(fileCompilation => {
          const source =
            fileCompilation.assets[fileCompilation.compiler.name].source();
          return Promise.all([
            Promise.resolve(source)
            .then(hash)
            .catch(() => ''),
            hashMembers(fileCompilation.fileDependencies, fileHash),
            hashMembers(fileCompilation.contextDependencies, contextHash),
          ])
          .then(([hash, fileHash, contextHash]) => {
            // console.log('new version', fileCompilation.compiler.name, hash);
            const listDepRequests = block => (
              block.dependencies
                .map(dep => dep.module instanceof ReferenceEntryModule ?
                  dep.module.dep.request :
                  null)
                .filter(Boolean)
            );
            const listVarRequests = block => (
              block.variables.map(listDepRequests)
            );
            const listBlkRequests = block => (
              listDepRequests(block)
              .concat(...listVarRequests(block))
              .concat(...block.blocks.map(listBlkRequests))
            );
            manifest[fileCompilation.compiler.name] = {
              fileDependencies: Array.from(fileCompilation.fileDependencies),
              contextDependencies: Array.from(fileCompilation.contextDependencies),
              hash,
              fileHash,
              contextHash,
              transforms: fileCompilation.modules
              .find(module => module.identifier().startsWith("entry reference"))
              .dependencies
              .reduce((carry, dep) => {
                if (!carry.find(_dep => _dep.module.request === dep.module.request)) {
                  carry.push(dep);
                }
                return carry;
              }, [])
              .map(dep => ({
                isEntry: !dep.module.rawRequest.startsWith('!!'),
                request: dep.module.request,
                rawRequest: dep.module.rawRequest,
                dependencies: listBlkRequests(dep.module)
                  .reduce((carry, dep) => {
                    if (carry.indexOf(dep) === -1) {
                      carry.push(dep);
                    }
                    return carry;
                  }, []),
              })),
            };
          });
        }))
        .then(() => depsHash)
        .then(depsHash => {
          manifest.__configHash = _configHash;
          manifest.__depsHash = depsHash;
          compilation.assets['manifest.json'] = new RawSource(JSON.stringify(manifest));
        });
      })
      .then(() => cb())
      .catch(cb);;
    });
  }
}

module.exports = ManifestPlugin;
