module.exports = (...attempts) => {
  let err;
  for (const fn of attempts) {
    try {
      return fn();
    }
    catch (_) {err = _;}
  }
  throw err;
};
