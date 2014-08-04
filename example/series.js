var ChainAsync = require('../');

var chain = new ChainAsync({
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
  .thingOne('1')
  .blargh()
  .returnTwoThree('two', 'three')
  .done(function (err, results) {
    console.log(arguments);
    console.log(thing);
  });
