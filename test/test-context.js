'use strict';
const assert        = require('assert');
const createContext = require('../index.js').createContext;
const should        = require('should');

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
       it('should not be able to change a readOnly string variable', function() {
           var ctx = createContext();
           ctx.set('fool', 'bar', true);
           ctx.fool.should.exactly('bar').and.be.a.String();
           should(ctx.get('fool')).exactly('bar').and.be.a.String();
           should(ctx).have.propertyWithDescriptor('fool', {writable:false, configurable:false});
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
       it('should not be able to change a readOnly object variable', function() {
           var ctx = createContext();
           var obj = {};
           ctx.set('fool', obj, true);
           ctx.fool.should.exactly(obj).and.be.a.Object();
           should(ctx.get('fool')).exactly(obj).and.be.a.Object();
           should(ctx).have.propertyWithDescriptor('fool', {writable:false, configurable:false});
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
});