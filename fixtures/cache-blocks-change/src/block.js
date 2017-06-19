var fib = function(n) {
  return n > 1 ? fib(n - 2) + fib(n - 1) : 1;
};

module.exports = fib;
