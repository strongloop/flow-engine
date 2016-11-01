// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node, mocha*/
'use strict';
var createContext = require('../index.js').createContext;
var should = require('should');

describe('context module', function() {
  describe('createContext', function() {
    describe('no namespace', function() {
      it('should directly attach variables to itself', function() {
        var ctx = createContext();
        ctx.set('fool', 'bar');
        ctx.fool.should.exactly('bar').and.be.a.String();
      });
    });
    describe('namespace apim', function() {
      it('should attach variables to ctx.apim', function() {
        var ctx = createContext('apim');
        ctx.set('fool', 'bar');
        ctx.apim.should.be.Object();
        ctx.apim.fool.should.exactly('bar').and.be.a.String();
      });
    });
  });
  describe('set then get', function() {
    it('should get original object when set an object', function() {
      var ctx = createContext();
      var obj = {};
      ctx.set('fool', obj);
      ctx.fool.should.exactly(obj).and.be.a.Object();
      should(ctx.get('fool')).exactly(obj).and.be.a.Object();
    });
    it('should get a string when set a string', function() {
      var ctx = createContext();
      ctx.set('fool', 'bar');
      ctx.fool.should.exactly('bar').and.be.a.String();
      should(ctx.get('fool')).exactly('bar').and.be.a.String();
    });
    it('should get a number when set a number', function() {
      var ctx = createContext();
      ctx.set('fool', 1000);
      ctx.fool.should.exactly(1000).and.be.a.Number();
      should(ctx.get('fool')).exactly(1000).and.be.a.Number();
    });
    it('should get undefined if does not exist', function() {
      var ctx = createContext();
      should(ctx.fool).be.a.undefined();
      should(ctx.get('fool')).be.a.undefined();
    });
  });
  describe('set then del', function() {
    it('should be able to del an object', function() {
      var ctx = createContext();
      var obj = {};
      ctx.set('foo.bar', obj);
      ctx.foo.bar.should.exactly(obj).and.be.a.Object();
      ctx.del('foo.bar');
      should(ctx.get('foo.bar')).exactly(undefined);
      ctx.foo.should.not.ownProperty('bar');
    });
    it('should be able to del a string', function() {
      var ctx = createContext();
      var val = 'value';
      ctx.set('foo', val);
      ctx.foo.should.exactly(val).and.be.a.String();
      ctx.del('foo');
      should(ctx.get('foo')).exactly(undefined);
      ctx.should.not.ownProperty('foo');
    });
    it('should get error when del readOnly props', function() {
      var ctx = createContext();
      var val = 'value';
      ctx.set('foo', val, true);
      ctx.foo.should.exactly(val).and.be.a.String();
      should.throws(function() {
        ctx.del('foo');
      });
    });
    it('should be able to del top level props', function() {
      var ctx = createContext();
      var val = 'value';
      ctx.set('foo.bar.my.value', val);
      ctx.foo.bar.my.value.should.exactly(val).and.be.a.String();
      ctx.del('foo');
      ctx.should.not.ownProperty('foo');
    });
  });
  describe('use dot notation to set then get', function() {
    it('should get original object when set an object', function() {
      var ctx = createContext();
      var obj = {};
      ctx.fool = obj;
      ctx.fool.should.exactly(obj).and.be.a.Object();
      should(ctx.get('fool')).exactly(obj).and.be.a.Object();
    });
    it('should get a string when set a string', function() {
      var ctx = createContext();
      ctx.fool = 'bar';
      ctx.fool.should.exactly('bar').and.be.a.String();
      should(ctx.get('fool')).exactly('bar').and.be.a.String();
    });
    it('should get a number when set a number', function() {
      var ctx = createContext();
      ctx.set('fool', 1000);
      ctx.set.fool = 1000;
      ctx.fool.should.exactly(1000).and.be.a.Number();
      should(ctx.get('fool')).exactly(1000).and.be.a.Number();
    });
  });
  describe('set readOnly variables', function() {
    it('should not be able to write a readOnly string variable', function() {
      var ctx = createContext();
      ctx.set('fool', 'bar', true);
      ctx.fool.should.exactly('bar').and.be.a.String();
      should(ctx.get('fool')).exactly('bar').and.be.a.String();
      should(ctx).have.propertyWithDescriptor(
          'fool', { writable: false, configurable: false });
      should.throws(function() {
        ctx.set('fool', 'test');
      });
      should.throws(function() {
        ctx.fool = 'test';
      });
      should.throws(function() {
        delete ctx.fool;
      });
    });
    it('should not be able to write a readOnly object variable', function() {
      var ctx = createContext();
      var obj = {};
      ctx.set('fool', obj, true);
      ctx.fool.should.exactly(obj).and.be.a.Object();
      should(ctx.get('fool')).exactly(obj).and.be.a.Object();
      should(ctx).have.propertyWithDescriptor(
          'fool', { writable: false, configurable: false });
      should.throws(function() {
        ctx.set('fool', 'test');
      });
      should.throws(function() {
        ctx.fool = 'test';
      });
      ctx.set('fool.child', 'mychild');
      ctx.fool.child.should.exactly('mychild').and.be.a.String();
    });
  });
  describe('define a variable', function() {
    it('should work like counter', function() {
      var ctx = createContext();
      var counter = 0;
      ctx.define('counter', function() {
        return counter++;
      });
      ctx.counter.should.exactly(0).and.be.a.Number();
      should(ctx.get('counter')).exactly(1).and.be.a.Number();
      ctx.counter.should.exactly(2).and.be.a.Number();
    });
    it('should not be re-define if configurable=false', function() {
      var ctx = createContext();
      ctx.define('fool', function() {
        return 'fool';
      }, false);
      should.throws(function() {
        ctx.define('fool', function() {
          return 'later';
        });
      });
      ctx.define('fool2', function() {
        return 'fool2';
      },
      function(value) {
      },
      false);
      should.throws(function() {
        ctx.define('fool2', function() {
          return 'later';
        });
      });
    });
    it('should be able to re-define if configurable=true', function() {
      var ctx = createContext();
      ctx.define('fool', function() {
        return 'fool';
      });
      ctx.define('fool', function() {
        return 'later';
      });
      ctx.fool.should.exactly('later').and.be.a.String();

      ctx.define('fool2', function() {
        return 'fool2';
      },
      function(value) {
      });
      ctx.define('fool2', function() {
        return 'later2';
      });
      ctx.fool2.should.exactly('later2').and.be.a.String();

      ctx.define('fool3', function() {
        return 'fool3';
      }, true);
      ctx.define('fool3', function() {
        return 'later3';
      }, true);
      ctx.fool3.should.exactly('later3').and.be.a.String();


      ctx.define('fool4', function() {
        return 'fool4';
      },
      function(value) {
      }, true);
      ctx.define('fool4', function() {
        return 'later4';
      });
      ctx.fool4.should.exactly('later4').and.be.a.String();
    });
    it('should be able to use setter', function() {
      var ctx = createContext();
      var myval = '';
      ctx.define('myval', function() {
        return myval;
      },
      function(value) {
        myval = 'xx' + value;
      });

      ctx.myval.should.exactly('').and.be.a.String();
      ctx.myval = 'new-val';
      ctx.myval.should.exactly('xxnew-val').and.be.a.String();
    });
    it('should get exception if setting a getter-only variable', function() {
      var ctx = createContext();
      ctx.define('fool', function() {
        return 'value';
      });
      ctx.fool.should.exactly('value').and.be.a.String();
      should.throws(function() {
        ctx.fool = 'new-value';
      });
    });
  });

  describe('subscribe event', function() {
    it('should be notified if subscribe a specific event', function(done) {
      var ctx = createContext();
      ctx.set('fool', 'bar', true);

      ctx.subscribe('post-process', function(event, next) {
        ctx.set('post-process', 'done');
        next();
      });

      ctx.notify('post-process', function(errors) {
        should(ctx.get('post-process')).exactly('done');
        should(errors).be.a.Undefined();
        done();
      });
    });

    it('should be able to get all errors in done callback', function(done) {
      var ctx = createContext();
      ctx.set('fool', 'bar', true);

      ctx.subscribe('post-process', function(event, next) {
        ctx.set('post-process1', 'done');
        next();
      });

      ctx.subscribe('post-process', function(event, next) {
        ctx.set('post-process2', 'done');
        next({ code: 400 });
      });

      ctx.subscribe('post-process', function(event, next) {
        ctx.set('post-process3', 'done');
        next({ code: 500 });
      });

      ctx.notify('post-process', function(errors) {
        should(ctx.get('post-process1')).exactly('done');
        should(ctx.get('post-process2')).exactly('done');
        should(ctx.get('post-process3')).exactly('done');
        should(errors).be.a.Array();
        should(errors.length).exactly(2);
        done();
      });
    });
  });
});
