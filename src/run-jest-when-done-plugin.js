const path = require('path');

class RunJestWhenDone {
  apply(compiler) {
    // var cliOnce = false;

    compiler.plugin('done', function() {
      const config = compiler.options;
      // if (watchMode && cliOnce) {
      //   return;
      // }
      // cliOnce = true;

      if (process.env.NODE_ENV == null) {
        process.env.NODE_ENV = 'test';
      }

      // require('fs').writeFileSync(
      //   path.join(config.context, '.cache/jest/webpack-preprocessor.js'),
      //   require('fs').readFileSync(path.join(__dirname, 'webpack-preprocessor.js'))
      // );

      try {
        require('jest-cli/build/cli').run(['--config', path.join(__dirname, '../jest.config.json'), '--rootDir', path.join(config.context, '.cache/jest/original')]);
      }
      catch (e) {
        console.error(e);
        require('jest/node_modules/jest-cli/build/cli').run(['--config', path.join(__dirname, '../jest.config.json'), '--rootDir', path.join(config.context, '.cache/jest/original')]);
      }
    });
  }
}

module.exports = RunJestWhenDone;
