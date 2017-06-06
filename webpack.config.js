var path = require('path');

var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
var JestWebpackPlugin = require('./src/jest-webpack-plugin');

var root = process.cwd();

module.exports = {
  // context: Content for entries.
  context: root,
  // devtool: Enable for source maps. Cheap means only line data. Module means
  // lines of the loader output, in this case the es5 output from babel.
  devtool: 'cheap-source-map',
  entry: {main: './main.js'},
  output: {path: path.join(__dirname, 'nowhere'), filename: 'fake'},
  // node: Options for automatic shims for node functionality.
  node: {
    // __dirname: Set false to disable automatic __dirname shim.
    __dirname: false,
  },
  // module: module configuration.
  module: {
    // rules: Loaders automatically applied based on test, include, and
    // exclude options.
    rules: [
      // Apply babel-loader to any js file not under node_modules.
      {
        test: /\.jsx?$/,
        exclude: [path.resolve(root, 'node_modules')],
        loader: 'babel-loader',
        // options: Babel-loader configuration.
        options: {
          // babel.presets: Plugin presets babel loader will add on top of those
          // specified in babelrc.
          'presets': ['jest', ['env', {modules: false}]],
        },
      },
    ],
  },
  // plugins: webpack plugins.
  plugins: [
    // A webpack cache plugin. A cache is written to the file system and reused
    // when possible during later runs for faster builds.
    new HardSourceWebpackPlugin({
      cacheDirectory: path.join(root, 'node_modules/.cache/hard-source/[confighash]'),
      recordsPath: path.join(root, 'node_modules/.cache/hard-source/[confighash]/records.json'),
      configHash: function(config) {
        // We can safely ignore entry in our hash. Changes to entry just mean
        // new chunks are built.
        config = Object.assign({}, config, {entry: null});
        return require('node-object-hash')().hash(config);
      },
      environmentPaths: {
        root: root,
      },
    }),
    new JestWebpackPlugin(),
  ],
};
