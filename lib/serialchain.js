module.exports = SerialChain;

function SerialChain(chain) {
  this._links = {};
  this._chain = [];
  if (chain && typeof chain === 'object') {
    for (var c in chain) {
      this.add(c, chain[c]);
    }
  }
  return this;
}

/* Method to add a new method to the chain
 * Accepts either "add('methodname', callback)"
 * or "add({ methodname: callback, methodtwo: callback, ... })"
 */
SerialChain.prototype.add = function (name, fn) {
  var _this = this;
  if (typeof name === 'string' && typeof fn === 'function') {
    addOne.apply(this, [name, fn])
  } else if (typeof name === 'object') {
    for (var n in name) {
      addOne.apply(this, [n, name[n]])
    }
  } else {
    throw new Error('Invalid add(): ', arguments);
  }
  return this;
}

/* Method to call when the chain is done
 * It calls all links (fns) in the _chain
 */
SerialChain.prototype.done = function (callback) {
  var _this = this;
  var _chain = _this._chain.map(function (link) {
    return function (done) {
      var args = [];
      for (var a in link.args) {
        args.push(link.args[a]);
      }
      args.push(done);
      _this._links[link.name].apply(_this, args);
    }
  });
  series(_chain, callback);
}

/* Add a method to the object
 * When called, the method will add it's fn to the series chain
 */
function addOne(name, fn) {
  if (this[name])
    throw new Error(name + ' is already defined!');
  var _this = this;
  _this._links[name] = fn;
  _this[name] = function () {
    _this._chain.push({
      name: name,
      args: arguments
    });
    return _this;
  };
  return _this;
}

/* Series code, inspired by:
 * - https://github.com/feross/run-series/blob/master/index.js
 * - http://book.mixu.net/node/ch7.html
 */
function series(fns, callback) {
  var results = [];
  // callback for when a fn is done
  function done(err, result) {
    if (err)
      return callback(err, results);
    results.push(result);
    if (fns.length)
      run(fns.shift());
    else
      callback(null, results);
  }
  // call the next fn
  function run(fn) {
    if (fn)
      fn(done);
    else
      callback(null, results);
  }
  // oink
  run(fns.shift());
}
