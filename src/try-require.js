module.exports = (...attempts) => {
  let err;
  for (const fn of attempts) {
    try {
      const exports = fn();
      return exports.default || exports;
    }
    catch (_) {err = _;}
  }
  throw err;
};
