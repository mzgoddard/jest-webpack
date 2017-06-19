var fact2 = function(n) {
  return n > 0 ? fact2(n - 1) + n : 0;
};

module.exports = fact2;