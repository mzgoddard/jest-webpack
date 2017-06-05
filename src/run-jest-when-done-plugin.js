const {join} = require('path');
const {spawn} = require('child_process');

class RunJestWhenDone {
  apply(compiler) {
    // var cliOnce = false;

    compiler.plugin('done', function() {
      const config = compiler.options;
      // if (watchMode && cliOnce) {
      //   return;
      // }
      // cliOnce = true;

      // if (process.env.NODE_ENV == null) {
      //   process.env.NODE_ENV = 'test';
      // }

      // require('fs').writeFileSync(
      //   path.join(config.context, '.cache/jest/webpack-preprocessor.js'),
      //   require('fs').readFileSync(path.join(__dirname, 'webpack-preprocessor.js'))
      // );

      // try {
      //   require('jest-cli/build/cli').run(['--config', path.join(__dirname, '../jest.config.json'), '--rootDir']);
      // }
      // catch (e) {
      //   console.error(e);
      //   require('jest/node_modules/jest-cli/build/cli').run(['--config', path.join(__dirname, '../jest.config.json')]);
      // }

      const child = spawn(
        join(config.context, 'node_modules/.bin/jest'),
        // ['--config', join(config.context, 'jest.config.json')],
        // ['--rootDir', join(config.context, '.cache/jest/webpack')],
        [],
        {
          cwd: join(config.context, '.cache/jest-webpack'),
          env: Object.assign({}, process.env, {
            NODE_ENV: 'test',
          }),
          stdio: 'inherit',
        }
      );
    });
  }
}

module.exports = RunJestWhenDone;
