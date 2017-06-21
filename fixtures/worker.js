const {dirname, join} = require('path');
const {readFileSync, statSync} = require('fs');
const {runInThisContext} = require('vm');

const {transform} = require('babel-core');
const findUp = require('find-up');

const jestWebpackPath = findUp.sync('jest-webpack.js');
const fixtureRootPath = join(dirname(jestWebpackPath), 'fixtures');

const jestWebpack = eval('require')(jestWebpackPath);

const wrapModule = code => {
  return '(function(exports, require, module, __filename, __dirname) {' +
    code +
  '})';
};

const callModule = (fn, filename) => {
  const module = {exports: {}};
  fn(module.exports, Object.assign(modulename => {
    if (/\W/.test(modulename[0])) {
      return eval('require')(join(dirname(filename), modulename));
    }
    return eval('require')(modulename);
  }, eval('require')), module, filename, dirname(filename));
  return module.exports;
};

const loadFreshConfig = configPath => {
  try {
    try {
      return callModule(runInThisContext(
        wrapModule(readFileSync(configPath, 'utf8')),
        {filename: configPath}
      ), configPath)
    }
    catch (_) {
      return callModule(runInThisContext(
        wrapModule(transform(readFileSync(configPath, 'utf8'), {presets: [['env', {targets: {node: 4}}]]}).code),
        {filename: configPath}
      ), configPath)
    }
  }
  catch (err) {
    console.error(err.stack || err);
    throw err;
  }
};

const fixtureWebpackConfigPath = fixture => {
  try {
    statSync(join(fixtureRootPath, fixture, 'webpack.config.babel.js'));
    return join(fixtureRootPath, fixture, 'webpack.config.babel.js');
  }
  catch (_) {}
  return join(fixtureRootPath, fixture, 'webpack.config.js');
};

const run = () => {
  let exitTimeout = -1;

  process.on('message', job => {
    clearTimeout(exitTimeout);
    const webpackConfig = loadFreshConfig(fixtureWebpackConfigPath(job.fixture));
    webpackConfig.plugins = webpackConfig.plugins || [];
    webpackConfig.plugins.push({
      apply(compiler) {
        compiler.plugin('jest-webpack-done', ({success}) => {
          process.send({id: job.id, success});
          exitTimeout = setTimeout(() => process.exit(), 100);
        });
      },
    });
    process.chdir(join(fixtureRootPath, job.fixture));
    jestWebpack(job.args || [], webpackConfig);
  });

  exitTimeout = setTimeout(() => process.exit(), 5000);
};

run();
