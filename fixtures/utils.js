const fs = require('fs');
const {dirname, join, relative, sep} = require('path');
const {spawn} = require('child_process');

const findUp = require('find-up');
const pify = require('pify');
const regeneratorRuntime = require('regenerator-runtime');
const _rimraf = require('rimraf');

const promisify = fn => (...args) => new Promise((resolve, reject) => {
  fn(...Array.from(args).concat((err, value) => {
    if (err) {return reject(err);}
    resolve(value);
  }))
});

const readdir = promisify(fs.readdir);
const rimraf = promisify(_rimraf);
const stat = promisify(fs.stat);

const walkDir = async (root, dir, files = []) => {
  let dirItems;
  try {
    dirItems = await readdir(dir);
  }
  catch (_) {}
  if (dirItems) {
    for (let item of dirItems) {
      const fullItem = join(dir, item);
      const itemStat = await stat(fullItem);
      if (itemStat.isDirectory()) {
        await walkDir(root, fullItem, files);
      }
      else {
        files.push(relative(root, fullItem));
      }
    }
  }
  return files;
};

const concat = pipe => {
  return new Promise(resolve => {
    let out = '';
    pipe.on('data', data => {
      out += data;
    });
    pipe.on('end', () => {
      resolve(out);
    });
  });
};

const _findPaths = fixturePath => {
  // These paths need to escape the jest-webpack cache.
  const jestWebpackBin = findUp.sync('jest-webpack.js', {
    cwd: __dirname,
  });
  const fullFixturePath = join(dirname(jestWebpackBin), 'fixtures', fixturePath);
  const fullJestWebpackPath = join(fullFixturePath, '.cache/jest-webpack');

  return {
    jestWebpackBin,
    fullFixturePath,
    fullJestWebpackPath,
  };
};

const clean = async result => {
  const {fullJestWebpackPath} = _findPaths(result.fixture);
  await rimraf(fullJestWebpackPath);
  return result;
};

const _runJest = result => {
  const {fixture, args} = result;
  const {jestWebpackBin, fullFixturePath, fullJestWebpackPath} =
    _findPaths(fixture);

  const child = spawn(process.argv[0], [
    jestWebpackBin,
  ].concat(args), {
    cwd: fullFixturePath,
    stdio: 'pipe',
  });

  const stdout = concat(child.stdout);
  const stderr = concat(child.stderr);
  const exit = new Promise(resolve => child.on('exit', resolve));
  // const built = exit
  // .then(() => walkDir(fullJestWebpackPath, fullJestWebpackPath));
  const built = exit
  .then(() => pify(fs.readFile)(join(fullJestWebpackPath, 'built.json'), 'utf8'))
  .then(JSON.parse);

  return Promise.all([stdout, stderr, exit, built])
  .catch(err => {
    console.error(err);
    return Promise.all([stdout, stderr])
    .then(([stdout, stderr]) => {
      console.error(stdout);
      console.error(stderr);
      throw err;
    });
  })
  .then(([stdout, stderr, exit, built]) => {
    return {
      fixture,
      args,
      exit,
      built,
      stdout,
      stderr,
    };
  });
};

const willRun = (fixturePath, args = []) => {
  return Promise.resolve({
    fixture: fixturePath,
    args,
  });
};

const run = (fixturePath, args = []) => {
  return willRun(fixturePath, args)
  .then(clean)
  .then(_runJest);
};

const runAgain = result => _runJest(result);

const writeFiles = obj => result => {
  const {fullFixturePath} = _findPaths(result.fixture);
  for (const key in obj) {
    fs.writeFileSync(join(fullFixturePath, key), obj[key].join('\n'));
  }
  return result;
};

const itPasses = result => {
  expect(result.exit).toBe(0);
  return result;
};

const itFails = result => {
  expect(result.exit).not.toBe(0);
  return result;
}

const itBuilt = (files) => result => {
  files.forEach(file => expect(result.built).toContain(file.replace(/\//g, sep)));
  return result;
};

const didNotBuild = (files) => result => {
  files.forEach(file => expect(result.built).not.toContain(file.replace(/\//g, sep)));
  return result;
};

const itTests = (files) => result => {
  files.forEach(file => expect(result.stderr).toMatch(file.replace(/\//g, sep)));
  return result;
};

const itSkips = (files) => result => {
  files.forEach(file => expect(result.stderr).not.toMatch(file.replace(/\//g, sep)));
  return result;
};

module.exports = {
  willRun,
  run,
  runAgain,
  writeFiles,
  clean,
  itPasses,
  itFails,
  itBuilt,
  didNotBuild,
  itTests,
  itSkips,
};
