var {join, resolve} = require('path');

var HardSourceWebpackPlugin = require('hard-source-webpack-plugin');
var webpackIf = require('webpack-if');

var root = process.cwd();

var startsWith = webpackIf.op((pred, value) => pred.startsWith(String(value)));

var nodeEnv = () => process.env.NODE_ENV;
var webpackVersion = () => require('webpack/package.json').version;

var isEnv = webpackIf.is(nodeEnv);
var isWebpackVersion = startsWith(webpackVersion);

var ifProd = webpackIf.ifElse(isEnv("production"));
var ifWebpack1 = webpackIf.ifElse(isWebpackVersion(1));

module.exports = webpackIf({
  // context: Content for entries.
  context: root,
  entry: {
    'jest-webpack': './src/jest-webpack.js',
  },
  output: {
    path: join(__dirname, 'webpack-1'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },

  // devtool: Enable for source maps. Cheap means only line data. Module means
  // lines of the loader output, in this case the es5 output from babel.
  devtool: 'cheap-source-map',

  externals: function(context, request, callback) {
    if (request.indexOf('!') === -1 && /^\w/.test(request)) {
      return callback(null, request, 'commonjs2');
    }
    callback(null);
  },

  target: 'node',

  // node: Options for automatic shims for node functionality.
  node: {
    // __dirname: Set false to disable automatic __dirname shim.
    __dirname: false,

    __filename: false,

    process: false,
  },
  // module: module configuration.
  module: {
    // rules: Loaders automatically applied based on test, include, and
    // exclude options.
    [ifWebpack1('loaders', 'rules')]: [
      // Apply babel-loader to any js file not under node_modules.
      {
        test: /\.jsx?$/,
        exclude: [resolve(root, 'node_modules')],
        loader: ifWebpack1(
          'babel-loader?{presets:[["env",{targets:{node:4}}]]}',
          'babel-loader',
        ),
        // options: Babel-loader configuration.
        options: ifWebpack1(null, () => ({
          // babel.presets: Plugin presets babel loader will add on top of those
          // specified in babelrc.
          'presets': [['env', {targets: {node: 4}}]],
        })),
      },
    ],
  },
  // plugins: webpack plugins.
  plugins: [
    // A webpack cache plugin. A cache is written to the file system and reused
    // when possible during later runs for faster builds.
    ifProd(null, () => new HardSourceWebpackPlugin()),
  ],
});
