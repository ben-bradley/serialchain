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
  if (typeof name === 'string' && typeof fn === 'function') {
    this._addOne(name, fn);
  } else if (typeof name === 'object') {
    for (var n in name) {
      this._addOne(n, name[n]);
    }
  } else {
    throw new Error('Invalid add(): ', arguments);
  }
  return this;
}

/* Add a method to the object
 * When called, the method will add it's fn to the series chain
 */
SerialChain.prototype._addOne = function (name, fn) {
  if (this[name])
    throw new Error(name + ' is already defined!');
  // add the method to the links object
  this._links[name] = fn;
  // add the method to the chain
  this[name] = function () {
    this._chain.push({
      name: name,
      args: arguments
    });
    return this;
  }.bind(this);
  //  return this;
}

/* Method to call when the chain is done
 * It calls all links (fns) in the _chain
 */
SerialChain.prototype.done = function (callback) {
  this._series(this._chain.map(function (link) {
    return function (next) {
      var args = [];
      for (var a in link.args) {
        args.push(link.args[a]);
      }
      if (link.timeout) {
        var timeout = setTimeout(function () {
          next(new Error('Timeout: ' + link.name));
        }, link.timeout);
        args.push(function () {
          clearTimeout(timeout);
          next.apply(this, arguments);
        }.bind(this));
      } else {
        args.push(next.bind(this));
      }
      this._links[link.name].apply(this, args);
    }.bind(this);
  }.bind(this)), callback);
}

SerialChain.prototype.timeout = function (time) {
  this._chain[this._chain.length - 1].timeout = time;
  return this;
}

/* Series code, inspired by:
 * - https://github.com/feross/run-series/blob/master/index.js
 * - http://book.mixu.net/node/ch7.html
 */
SerialChain.prototype._series = function (fns, callback) {
  var results = [],
    error = false;
  // callback for when a method is done
  function next(err, result) {
    if (err) {
      error = true;
      return callback(err, results);
    }
    results.push(result);
    if (!error && fns.length)
      run(fns.shift());
    else if (!error)
      callback(null, results);
  }
  // call the next method
  function run(fn) {
    if (fn)
      fn(next);
    else
      callback(null, results);
  }
  // oink
  run(fns.shift());
}
