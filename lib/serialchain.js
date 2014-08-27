module.exports = SerialChain;

function SerialChain(chain) {
  this._links = {};
  this._chain = [];
  this.locals = {};
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
  if (typeof name === 'string' && typeof fn === 'function')
    addOne.apply(this, [name, fn]);
  else if (typeof name === 'object') {
    for (var n in name) {
      addOne.apply(this, [n, name[n]]);
    }
  } else
    throw new Error('Invalid add(): ', arguments);
  return this;
}

/* Method to call when the chain is done
 * It calls all links (fns) in the _chain
 */
SerialChain.prototype.done = function (callback) {
  series.apply(this, [this._chain.map(function (link) {
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
  }.bind(this)), callback]);
  this._chain = [];
}

/* Add a timeout property to the link
 *
 */
SerialChain.prototype.timeout = function (time) {
  this._chain[this._chain.length - 1].timeout = time;
  return this;
}

/* Add a method to the object
 * When called, the method will add it's fn to the series chain
 */
//SerialChain.prototype._addOne = function (name, fn) {
function addOne(name, fn) {
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
}

/* Series code, inspired by:
 * - https://github.com/feross/run-series/blob/master/index.js
 * - http://book.mixu.net/node/ch7.html
 */
function series(fns, callback) {
  var results = [],
    error = false;
  // callback for when a method is done
  function next(err, result) {
    if (error)
      return;
    error = (err || error) ? true : error;
    if (err)
      return callback.call(this, err, results);
    if (result)
      results.push(result);
    if (fns.length)
      run(fns.shift());
    else
      callback.call(this, null, results);
  }
  // call the next method
  function run(fn) {
    if (fn)
      fn(next);
    else
      callback.call(this, null, results);
  }
  // oink
  run(fns.shift());
}
