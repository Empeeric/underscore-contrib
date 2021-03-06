module.exports = function (_) {

  // Helpers
  // -------

  function enforcesUnary(fn) {
    return function mustBeUnary() {
      if (arguments.length === 1) {
        return fn.apply(this, arguments);
      }
      else throw new RangeError('Only a single argument may be accepted.');

    };
  }

  // Curry
  // -------
  var curry = (function () {
    function collectArgs(func, that, argCount, args, newArg, reverse) {
      if (reverse === true) {
        args.unshift(newArg);
      } else {
        args.push(newArg);
      }
      if (args.length == argCount) {
        return func.apply(that, args);
      } else {
        return enforcesUnary(function () {
          return collectArgs(func, that, argCount, args.slice(0), arguments[0], reverse);
        });
      }
    }

    return function curry(func, reverse) {
      var that = this;
      return enforcesUnary(function () {
        return collectArgs(func, that, func.length, [], arguments[0], reverse);
      });
    };
  }());

  // Enforce Arity
  // --------------------
  var enforce = (function () {
    var CACHE = [];
    return function enforce(func) {
      if (typeof func !== 'function') {
        throw new Error('Argument 1 must be a function.');
      }
      var funcLength = func.length;
      if (CACHE[funcLength] === undefined) {
        CACHE[funcLength] = function (enforceFunc) {
          return function () {
            if (arguments.length !== funcLength) {
              throw new RangeError(funcLength + ' arguments must be applied.');
            }
            return enforceFunc.apply(this, arguments);
          };
        };
      }
      return CACHE[funcLength](func);
    };
  }());

  // Right curry variants
  // ---------------------
  var curryRight = function (func) {
    return curry.call(this, func, true);
  };

  var curryRight2 = function (fun) {
    return enforcesUnary(function (last) {
      return enforcesUnary(function (first) {
        return fun.call(this, first, last);
      });
    });
  };

  var curryRight3 = function (fun) {
    return enforcesUnary(function (last) {
      return enforcesUnary(function (second) {
        return enforcesUnary(function (first) {
          return fun.call(this, first, second, last);
        });
      });
    });
  };

  // Mixing in the arity functions
  // -----------------------------

  _.mixin({
    // ### Fixed arguments

    // Fixes the arguments to a function based on the parameter template defined by
    // the presence of values and the `_` placeholder.
    fix: function (fun) {
      var fixArgs = _.tail(arguments);

      var f = function () {
        var args = fixArgs.slice();
        var arg = 0;

        for (var i = 0; i < (args.length || arg < arguments.length); i++) {
          if (args[i] === _) {
            args[i] = arguments[arg++];
          }
        }

        return fun.apply(null, args);
      };

      f._original = fun;

      return f;
    },

    unary: function (fun) {
      return function unary(a) {
        return fun.call(this, a);
      };
    },

    binary: function (fun) {
      return function binary(a, b) {
        return fun.call(this, a, b);
      };
    },

    ternary: function (fun) {
      return function ternary(a, b, c) {
        return fun.call(this, a, b, c);
      };
    },

    quaternary: function (fun) {
      return function quaternary(a, b, c, d) {
        return fun.call(this, a, b, c, d);
      };
    },

    rCurry: curryRight, // alias for backwards compatibility

    curry2: function (fun) {
      return enforcesUnary(function curried(first) {
        return enforcesUnary(function (last) {
          return fun.call(this, first, last);
        });
      });
    },

    curry3: function (fun) {
      return enforcesUnary(function (first) {
        return enforcesUnary(function (second) {
          return enforcesUnary(function (last) {
            return fun.call(this, first, second, last);
          });
        });
      });
    },

    // reverse currying for functions taking two arguments.
    curryRight2: curryRight2,
    rcurry2: curryRight2, // alias for backwards compatibility

    curryRight3: curryRight3,
    rcurry3: curryRight3, // alias for backwards compatibility

    // Dynamic decorator to enforce function arity and defeat varargs.
    enforce: enforce,

    arity: (function () {
      // Allow 'new Function', as that is currently the only reliable way
      // to manipulate function.length
      /* jshint -W054 */
      var FUNCTIONS = {};
      return function arity(numberOfArgs, fun) {
        if (FUNCTIONS[numberOfArgs] == null) {
          var parameters = new Array(numberOfArgs);
          for (var i = 0; i < numberOfArgs; ++i) {
            parameters[i] = "__" + i;
          }
          var pstr = parameters.join();
          var code = "return function (" + pstr + ") { return fun.apply(this, arguments); };";
          FUNCTIONS[numberOfArgs] = new Function(['fun'], code);
        }
        if (fun == null) {
          return function (fun) { return arity(numberOfArgs, fun); };
        }
        else return FUNCTIONS[numberOfArgs](fun);
      };
    })()
  });


};
