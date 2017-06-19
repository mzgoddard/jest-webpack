var tryRequire = function() {
  var attempts = [].slice.call(arguments);
  var err;
  for (var i = 0; i < attempts.length; i++) {
    var fn = attempts[i];
    try {
      return fn();
    }
    catch (_) {err = _;}
  }
  throw err;
};

var RawSource = tryRequire(
  function() {
    return require('webpack/node_modules/webpack-sources/lib/RawSource');
  },
  function() {
    return require('webpack/node_modules/webpack-core/lib/RawSource');
  },
  function() {
    return require('webpack-sources/lib/RawSource');
  },
  function() {
    return require('webpack-core/lib/RawSource');
  }
);

function AssetsBuiltPlugin() {}

AssetsBuiltPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, cb) {
    try {
      compilation.assets['built.json'] =
        new RawSource(JSON.stringify(Object.keys(compilation.assets)));
    }
    catch (e) {
      return cb(e);
    }
    cb();
  });
};

module.exports = AssetsBuiltPlugin;
