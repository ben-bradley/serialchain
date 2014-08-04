var ChainAsync = require('../'),
  should = require('should');

describe('ChainAsync()', function () {

  it('should create an instance', function (done) {
    var chain = new ChainAsync();
    (chain).should.be.instanceof(ChainAsync);
    done();
  });

  it('should allow method creation at instantiation', function (done) {
    var chain = new ChainAsync({
      methodOne: function (x, done) {
        setTimeout(function () {
          done(null, x);
        }, 250);
      }
    });
    (chain.methodOne).should.be.a.function;
    done();
  });

  it('should allow method creation after instantiation - object', function (done) {
    var chain = new ChainAsync();
    chain.add({
      methodOne: function (x, done) {
        setTimeout(function () {
          done(null, x);
        }, 250);
      }
    });
    (chain.methodOne).should.be.a.function;
    done();
  });

  it('should allow method creation after instantiation - args', function (done) {
    var chain = new ChainAsync();
    chain.add('methodOne', function (x, done) {
      setTimeout(function () {
        done(null, x);
      }, 250);
    });
    (chain.methodOne).should.be.a.function;
    done();
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
    }
  };

  it('should return [ "abc", "xyz" ]', function (done) {
    var chain = new ChainAsync(links);

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
    var chain = new ChainAsync(links);

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

  it('should return an error', function (done) {
    var chain = new ChainAsync(links);
    chain.add('errorMethod', function (x, done) {
      var err = new Error(x);
      done(err);
    });

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

});
