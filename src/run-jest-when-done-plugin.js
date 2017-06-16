const {statSync} = require('fs');
const {join} = require('path');
const {spawn} = require('child_process');

const findUp = require('find-up');

class RunJestWhenDone {
  constructor(options = {}) {
    this.options = options;
  }

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

      const _jestPath = findUp.sync('node_modules/.bin/jest', {
        cwd: __dirname,
      });
      const _jestWindowsPath = _jestPath + '.cmd';

      let jestPath;
      try {
        statSync(_jestWindowsPath);
        jestPath = _jestWindowsPath;
      }
      catch (_) {
        jestPath = _jestPath;
      }

      const argv = process.argv.slice(2);
      const child = spawn(
        jestPath,
        argv,
        {
          cwd: join(config.context, '.cache/jest-webpack'),
          env: Object.assign({}, process.env, {
            NODE_ENV: 'test',
          }),
          stdio: 'inherit',
        }
      );
      child.on('exit', code => {
        if (code) {
          process.exit(code);
        }
      });
    });
  }
}

module.exports = RunJestWhenDone;
