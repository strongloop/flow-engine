// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node, mocha*/
'use strict';
var createContext = require('../lib/context').createContext;
var Flow = require('../lib/flow').Flow;
var yaml = require('yamljs');
var should = require('should');

function createFlow(assembly, tasks, paramResolver, done) {

  var config = yaml.load(assembly);
  //start to run the flow engine
  var ctx = createContext();
  if (config.context) {
    for (var key in config.context) {
      ctx.set(key, config.context[key]);
    }
  }

  var taskHandlers = {};
  for (var task in tasks) {
    taskHandlers[task] = require(tasks[task])({});
  }

  var flow = new Flow(config,
      { paramResolver: require(paramResolver)(),
        tasks: taskHandlers,
      });
  flow.prepare(ctx, done);
  flow.run();
  return ctx;
}

describe('Flow', function() {

  it('has methods as described in public api documentation', function() {

    // Changing these would require a change to the major version number
    var expectedMethods = [
      'prepare',
      'run',
      'subscribe',
      'unsubscribe',
    ];

    var config = yaml.load(__dirname + '/test-flow/simple.yaml');
    var options = {};
    var flow = new Flow(config, options);

    expectedMethods.forEach(function(method) {
      flow.should.have.property(method);
      (flow[method]).should.be.a.Function();
    });
  });

  describe('policy execution', function() {
    describe('bugs', function() {
      describe('issue 35', function() {
        it('should be no-op when call next twice', function(done) {
          createFlow(__dirname + '/test-flow/simple.yaml',
            {
              'bad-policy': __dirname + '/test-flow/bad-policy',
              'set-code': __dirname + '/test-flow/set-code',
            },
            __dirname + '/util/apim-param-resolver',
            function() {
              done();
            });
        });
      });
    });

    describe('flow stop', function() {
      it('should stop flow after first policy', function(done) {
        var ctx = createFlow(__dirname + '/test-flow/flow-stop.yaml',
            { mypolicy: __dirname + '/test-flow/mypolicy' },
            __dirname + '/util/apim-param-resolver',
            function() {
              should(ctx.get('foo')).exactly('bar');
              done();
            });
      });
    });

    describe('no param resolving', function() {
      it('should git $() without replacement', function(done) {
        var ctx = createFlow(__dirname + '/test-flow/no-param-resolving.yaml',
            { mypolicy: __dirname + '/test-flow/no-param-resolving' },
            __dirname + '/util/apim-param-resolver',
            function() {
              should(ctx.get('myval')).exactly('$(myval)');
              done();
            });
      });
    });
  });
});
