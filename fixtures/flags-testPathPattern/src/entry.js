var fact = function(n) {
  return n > 0 ? fact(n - 1) + n : 0;
};

module.exports = fact;
