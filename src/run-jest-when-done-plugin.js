const {join} = require('path');

const jest = require('jest');

class RunJestWhenDone {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const {argv, jestArgv} = this.options;
    // let cliOnce = false;

    compiler.plugin('done', function() {
      const config = compiler.options;
      // if (watchMode && cliOnce) {
      //   return;
      // }
      // cliOnce = true;

      const wd = join(config.context, '.cache/jest-webpack');
      const oldWd = process.cwd();
      process.chdir(wd);

      jest.runCLI(jestArgv, [wd], (result) => {
        if (compiler._plugins['jest-webpack-done']) {
          process.chdir(oldWd);
          compiler.applyPlugins('jest-webpack-done', result);
        }
        else if (!result.success) {
          process.on('exit', () => process.exit(1));
        }
        else if (jestArgv.forceExit) {
          process.exit(result.success ? 0 : 1);
        }
      });
    });
  }
}

module.exports = RunJestWhenDone;
