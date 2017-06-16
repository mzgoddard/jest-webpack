const {spawn} = require('child_process');
const {statSync} = require('fs');

const findUp = require('find-up');

const jestExec = (args = [], options = {}) => {
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

  const concat = stream => {
    return new Promise(resolve => {
      let value = '';
      stream.on('data', data => {value += data;});
      stream.on('end', () => {resolve(value);});
    });
  };

  return new Promise((resolve, reject) => {
    const child = spawn(
      jestPath,
      args,
      Object.assign({}, options, {
        env: Object.assign({}, process.env, {
          NODE_ENV: 'test',
        }, options.env),
        stdio: options.stdio || 'inherit',
      })
    );
    let stdout, stderr;
    if (options.stdio === 'pipe') {
      stdout = concat(child.stdout);
      stderr = concat(child.stderr);
    }
    child.on('exit', code => {
      Promise.all([stdout, stderr])
      .then(([stdout, stderr]) => {
        resolve({
          code,
          stdout,
          stderr,
        });
      });
    });
  });
};

const jestConfig = (args = [], options = {}) => {
  return jestExec(args.concat('--showConfig'), {stdio: 'pipe'})
  .then(({stdout}) => stdout)
  .then(JSON.parse);
};

jestExec.config = jestConfig;

module.exports = jestExec;
