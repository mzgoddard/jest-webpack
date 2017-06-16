const {statSync} = require('fs');
const {join} = require('path');
const {spawn} = require('child_process');

const findUp = require('find-up');

const jestExec = require('./jest-exec');

class RunJestWhenDone {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    // let cliOnce = false;

    compiler.plugin('done', function() {
      const config = compiler.options;
      // if (watchMode && cliOnce) {
      //   return;
      // }
      // cliOnce = true;

      const argv = process.argv.slice(2);

      jestExec(argv, {
        cwd: join(config.context, '.cache/jest-webpack'),
      })
      .then(({code}) => {
        if (code) {
          process.exit(code);
        }
      });
    });
  }
}

module.exports = RunJestWhenDone;
