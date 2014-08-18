var SerialChain = require('../');

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
})

chain
  .returnOne('one')
  .thingOne('1').timeout(5000)
  .blargh()
  .returnTwoThree('two', 'three')
  .done(function (err, results) {
    console.log(arguments);
  });

var newChain = new SerialChain();

newChain.add('methodA', function (done) {
  var locals = this.locals;
  // do something async to produce a value to pass to the next method
  locals.a = 'produced value';
  done(); // nothing is returned
});

newChain.add('methodB', function (done) {
  if (this.locals.a)
    this.locals.b = 'methodA() was called first';
  else
    this.locals.b = 'methodB() was called first';
  done(); // nothing is returned
});

newChain
  .methodB()
  .methodA()
  .done(function (err, results) {
    console.log(results); // => [] because neither returned anything
    console.log(this.locals); // =>
    // { a: 'produced value', b: 'methodB() was called first' }
  });
