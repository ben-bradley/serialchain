# SerialChain [![Build Status](https://secure.travis-ci.org/ben-bradley/serialchain.png)](http://travis-ci.org/ben-bradley/serialchain)
[![NPM](https://nodei.co/npm/serialchain.png)](https://nodei.co/npm/serialchain/)

### Description

SerialChain is a module I wrote to so that I could write pretty code.

I like writing chains and really wanted to be able to do it with asynch code.  There are a couple other options out there that already do this, but I wanted to learn how to write my own so I made this one.

### Installation

`npm install serialchain`

`npm install ben-bradley/serialchain`

### Concepts & Use

- You create a `chain`:
```
var chain = new SerialChain({ methodA: function(a, done) {
  // do something
  done(err, a);
}})
```

- You `add()` links to the `chain`.
```
chain.add('methodB', function(b, done) {
  // do something else
  done(err, b);
});
```

- You can then compose and execute your `chain`
```
chain
  .methodB('xyz')
  .methodA('abc').timeout(1500)
  .done(function(err, results) {
    if (err)
      throw err;
    console.log(results); // => [ 'xyz', 'abc' ]
  });
```

### `this.locals`

I found that I needed to have an easy way to pass variables between my chained methods so I added the `locals` property/namespace to the `chain`.

```js
var chain = new SerialChain();

chain.add('methodA', function (done) {
  var locals = this.locals;
  // do something async to produce a value to pass to the next method
  setTimeout(function() {
    locals.a = 'produced value';
  }, 100);
  done(); // nothing is returned
});

chain.add('methodB', function (done) {
  if (this.locals.a)
    this.locals.b = 'methodA() was called first';
  else
    this.locals.b = 'methodB() was called first';
  done(); // nothing is returned
});

chain
  .methodB()
  .methodA()
  .done(function (err, results) {
    console.log(results); // => [] because neither returned anything
    console.log(this.locals); // =>
    // { a: 'produced value', b: 'methodB() was called first' }
  });
```

### Built-in Methods

- __`SerialChain()`__
  - Returns a new `chain`.
  - Accepts an `Object` to add to the chain:
  ```
  var chain = new SerialChain({ methodName: callback });
  ```
  - Added method `callback`s have the signature:
  ```
  function([arguments, from, chain, call, ]done) {
    // ...
  }
  ```

- __`add()`__
  - This method adds other methods (links) to your `chain`
  - Accepts arguments as an `Object`:
  ```
  chain.add({ methodName: callback });
  ```
  - Also accepts `String` and `Function`
  ```
  chain.add('methodName', callback);
  ```
  - Added method `callback`s have the signature:
  ```
  function([arguments, from, chain, call, ]done) {
    // ...
  }
  ```

- __`timeout()`__
  - Calling this method after an `add()`ed method will set a timeout on the previously called method.
  - Arguments are a `Number` of ms to wait
  ```
    chain
      .methodA('a').timeout(1000) // will wait 1 second and bail
      .methodB('b')
      .done(function(err, results) {
        // ...
      });
  ```

- __`done()`__
  - This method triggers the execution of the `chain`.
  - Arguments are a callback:
  ```
    chain
      .methodA('a')
      .methodB('b')
      .done(function(err, results) {
        // ...
      })
  ```

### Example
```js
var SerialChain = require('serialchain');

var chain = new SerialChain({
  thingOne: function (a, done) {
    setTimeout(function () {
      done(null, a + '-thingOne');
    }, 100);
  },
  makeError: function (err, done) {
    done(new Error(err));
  }
});

chain.add('returnOne', function (a, done) {
  setTimeout(function () {
    done(null, a);
  }, 500);
});

chain.add('returnTwoThree', function (a, b, done) {
  setTimeout(function () {
    done(null, a + b);
  }, 1500);
});

chain.add({
  blargh: function (done) {
    done(null, 'honk');
  }
});

chain
  .returnOne('one')
  // thingOne() will complete in 100ms so this timeout will pass
  .thingOne('1').timeout(1000)
  .blargh()
  .returnTwoThree('two', 'three')
  .done(function (err, results) {
    console.log(arguments);
  });
```

### Tests

`$ npm install && npm test`

### Version History

- 0.0.8 - Ensured that errors are promoted to be a `new Error()`
- 0.0.7 - Added code to clean up `_chain` when `done()` is called
- 0.0.6 - Added `locals` namespace to pass vars between methods
- 0.0.5 - Calling `done()` without args in an `add()`ed method doesn't populate results.
- 0.0.4 - Version bump, added Travis-CI.
- 0.0.3 - Added `timeout()`.
- 0.0.2 - Refactored to `serialchain`.
- 0.0.1 - Removed `async` dependency.
- 0.0.0 - Initial drop.

### Other Options
- __continue__ - https://www.npmjs.org/package/continue - I took a lot of design ideas from this package, but it operates against a collection.
