var SerialChain = require('../'),
  should = require('should');

describe('SerialChain()', function () {

  it('should create an instance', function (done) {
    var chain = new SerialChain();
    (chain).should.be.instanceof(SerialChain);
    done();
  });

  it('should allow method creation at instantiation', function (done) {
    var chain = new SerialChain({
      methodOne: function (x, done) {
        setTimeout(function () {
          done(null, x);
        }, 100);
      }
    });
    (chain.methodOne).should.be.a.function;
    done();
  });

  it('should allow method creation after instantiation - object', function (done) {
    var chain = new SerialChain();
    chain.add({
      methodOne: function (x, done) {
        setTimeout(function () {
          done(null, x);
        }, 100);
      }
    });
    (chain.methodOne).should.be.a.function;
    done();
  });

  it('should allow method creation after instantiation - args', function (done) {
    var chain = new SerialChain();
    chain.add('methodOne', function (x, done) {
      setTimeout(function () {
        done(null, x);
      }, 100);
    });
    (chain.methodOne).should.be.a.function;
    done();
  });

  it('should have a .locals namespace', function (done) {
    var chain = new SerialChain
    chain.add('methodOne', function (done) {
      (this.locals).should.be.an.Object;
      setTimeout(function () {
        done(null);
      }, 100);
    });
    chain.methodOne().done(function (err, results) {
      done(err);
    });
  });

});

describe('chain', function () {

  var links = {
    methodA: function (a, done) {
      setTimeout(function () {
        done(null, a);
      }, 250);
    },
    methodB: function (b, done) {
      setTimeout(function () {
        done(null, b);
      }, 250);
    },
    methodC: function (done) {
      setTimeout(function () {
        done();
      }, 100);
    },
    errorMethod: function (x, done) {
      var err = new Error(x);
      done(err);
    },
    timeoutMethod: function (x, done) {
      setTimeout(function () {
        done(null, x);
      }, 1250);
    },
    methodD: function (done) {
      var locals = this.locals;
      setTimeout(function () {
        if (locals.foo)
          locals.foo += 'baz';
        else
          locals.foo = 'bar';
        done(null, locals.foo);
      }, 100);
    }
  };

  it('should return [ "abc", "xyz" ]', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodA('abc')
      .methodB('xyz')
      .done(function (err, results) {
        (results).should.be.an.Array;
        (results[0]).should.equal('abc');
        (results[1]).should.equal('xyz');
        done();
      });
  });

  it('should return [ "xyz", "abc" ]', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodB('xyz')
      .methodA('abc')
      .done(function (err, results) {
        (results).should.be.an.Array;
        (results[0]).should.equal('xyz');
        (results[1]).should.equal('abc');
        done();
      });
  });

  it('should return [ "xyz", "abc" ]', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodB('xyz')
      .methodC()
      .methodA('abc')
      .done(function (err, results) {
        (results).should.be.an.Array;
        (results[0]).should.equal('xyz');
        (results[1]).should.equal('abc');
        done();
      });
  });

  it('should return an error', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodA('abc')
      .errorMethod('this is an error')
      .methodB('xyz')
      .done(function (err, results) {
        (err).should.be.an.Error;
        (err.message).should.equal('this is an error');
        done();
      });
  });

  it('should return a timeout', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodA('abc')
      .timeoutMethod('fail').timeout(1000)
      .methodB('xyz')
      .done(function (err, results) {
        (err).should.be.an.Error;
        (err.message).should.equal('Timeout: timeoutMethod');
        done();
      });
  });

  it('should pass by the timeout', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodA('abc')
      .timeoutMethod('pass').timeout(1500)
      .methodB('xyz')
      .done(function (err, results) {
        (err === null).should.be.true;
        (results).should.be.an.Array;
        (results[0]).should.equal('abc');
        (results[1]).should.equal('pass');
        (results[2]).should.equal('xyz');
        done();
      });
  });

  it('should let variables pass between methods via locals', function (done) {
    this.timeout(3000);
    var chain = new SerialChain(links);
    chain
      .methodD()
      .methodD()
      .done(function (err, results) {
        (err === null).should.be.true;
        (results).should.be.an.Array;
        (this.locals.foo).should.equal('barbaz');
        (results[0]).should.equal('bar');
        (results[1]).should.equal('barbaz');
        done();
      });
  });

});
