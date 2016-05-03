//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node, mocha*/
'use strict';
var startGateway = require('./util/start-gateway.js');
var path = require('path');
var express = require('express');
var supertest = require('supertest');
var yaml = require('yamljs');
var Flow = require('../index.js').Flow;
var createContext = require('../index.js').createContext;
var assert = require('assert');

//subscribe testcases:
describe('flow.subscribe()', function() {

  //verify the START event
  describe('START event', function() {
    describe('single and multiple event handlers', function() {
      it('next()',
          testSTARTEvent);
      it('next(error)',
          testSTARTEventNextError);
      it('next(error)',
          testSTARTEventThrowError);
    });
  });


  //verify the FINISH event
  //1. 1 FINISH subscriber: the event handler calls next(error)
  //2. 1 FINISH subscriber: the event handler calls next()
  //3. 1 FINISH subscriber: the event handler throws error
  //4. 2 FINISH subscribers: the event handlers call next(error)
  //5. 2 FINISH subscribers: the event handlers call next()
  //6. 2 FINISH subscribers: 1st calls next(error) and 2nd calls next()
  //7. 2 FINISH subscribers: 1st calls next() and 2nd calls next(error)
  //8. 2 FINISH subscribers: both throw errors
  //9. No FINISH event
  //10. FINISH and pre:FINISH and post:FINISH
  describe('FINISH event', function() {
    describe('single and multiple event handlers', function() {
      it('next(error)',
          testFINISHEventNextError);
      it('next()',
          testFINISHEventNext);
      it('throw error',
          testFINISHEventThrowError);
      it('2 next(error)',
          testMultipleFINISHEventNextErrors);
      it('2 next()',
          testMultipleFINISHEventNext);
      it('next(error) then next()',
          testMultipleFINISHEventNextAndNextError);
      it('next() then next(error)',
          testMultipleFINISHEventNextAndNextError2);
      it('both throw error',
          testMultipleFINISHEventThrow);
      it('no FINISH event',
          testNoFINISHEvent);
      it('pre:FINISH, FINISH and post:FINISH',
          test3FINISHEvents);
    });
  });

  //verify the ERROR event
  //1. 1 ERROR subscriber: the event handler calls next(error)
  //2. 1 ERROR subscriber: the event handler calls next()
  //3. 1 ERROR subscriber: the event handler throws error
  //4. 2 ERROR subscribers: the event handlers call next(error)
  //5. 2 ERROR subscribers: the event handlers call next()
  //6. 2 ERROR subscribers: 1st calls next(error) and 2nd calls next()
  //7. 2 ERROR subscribers: 1st calls next() and 2nd calls next(error)
  //8. 2 ERROR subscribers: both throw errors
  //9. no ERROR event
  //10. pre:ERROR, ERROR, post:ERROR
  describe('ERROR event', function() {
    describe('single and multiple event handlers', function() {
      it('next(error)',
          testERROREventNextError);
      it('next()',
          testERROREventNext);
      it('throw error',
          testERROREventThrowError);
      it('2 next(error)',
          testMultipleERROREventNextErrors);
      it('2 next()',
          testMultipleERROREventNext);
      it('next(error) then next()',
          testMultipleERROREventNextAndNextError);
      it('next() then next(error)',
          testMultipleERROREventNextAndNextError2);
      it('both throw error',
          testMultipleERROREventThrow);
      it('no ERROR event',
          testNoERROREvent);
      it('pre:ERROR, ERROR and post:ERROR',
          test3ERROREvents);
    });
  });

  //verify the pre event
  //1. 1 pre subscriber: the event handler calls next(error)
  //2. 1 pre subscriber: the event handler calls next()
  //3. 1 pre subscriber: the event handler throws error
  //4. 2 pre subscribers: the event handlers call next(error)
  //5. 2 pre subscribers: the event handlers call next()
  //6. 2 pre subscribers: 1st calls next(error) and 2nd calls next()
  //7. 2 pre subscribers: 1st calls next() and 2nd calls next(error)
  //8. 2 pre subscribers: both throw errors
  //9. no pre event
  describe('pre event', function() {
    describe('single and multiple event handlers', function() {
      it('next(error)',
          testPreEventNextError);
      it('next()',
          testPreEventNext);
      it('throw error',
          testPreEventThrowError);
      it('2 next(error)',
          testMultiplePreEventNextErrors);
      it('2 next()',
          testMultiplePreEventNext);
      it('next(error) then next()',
          testMultiplePreEventNextAndNextError);
      it('next() then next(error)',
          testMultiplePreEventNextAndNextError2);
      it('both throw error',
          testMultiplePreEventThrow);
      it('no pre event',
          testNoPreEvent);
    });
  });

  //verify the post event
  //1. 1 post subscriber: the event handler calls next(error)
  //2. 1 post subscriber: the event handler calls next()
  //3. 1 post subscriber: the event handler throws error
  //4. 2 post subscribers: the event handlers call next(error)
  //5. 2 post subscribers: the event handlers call next()
  //6. 2 post subscribers: 1st calls next(error) and 2nd calls next()
  //7. 2 post subscribers: 1st calls next() and 2nd calls next(error)
  //8. 2 post subscribers: both throw errors
  //9. no post event
  describe('post event', function() {
    describe('single and multiple event handlers', function() {
      it('next(error)',
          testPostEventNextError);
      it('next()',
          testPostEventNext);
      it('throw error',
          testPostEventThrowError);
      it('2 next(error)',
          testMultiplePostEventNextErrors);
      it('2 next()',
          testMultiplePostEventNext);
      it('next(error) then next()',
          testMultiplePostEventNextAndNextError);
      it('next() then next(error)',
          testMultiplePostEventNextAndNextError2);
      it('both throw error',
          testMultiplePostEventThrow);
      it('no pre event',
          testNoPostEvent);
    });
  });

  //multiple-event subscriber
  //1. 1 task subscribes multiple events
  //2. 2 tasks subscribe multiple events
  //3. subscribe the same event multiple times
  //4. unsupported events
  describe('multiple events', function() {
    describe('1 task subscribes multiple events', function() {
      it('FINISH, pre:mytask and post:mytask',
          testFINISHPrePostEventsNextError);
    });
    describe('2 tasks subscribe multiple events', function() {
      it('FINISH, pre:mytask and post:mytask',
          test2FINISHPrePostEventsNextError);
      it('subscribe the same event multiple times',
          testSameEventsNextError);
    });
    describe('subscribe multiple unsupported events', function() {
      it('fool, myevent, pre:myevent, post:myevent',
          testUnsupportedEvents);
    });
  });
});

//unsubscribe testcases:
describe('flow.unsubscribe()', function() {
  describe('sub and then unsub', function() {
    it('sub 2 and unsub 1',
        testSub2Unsub1);
    it('sub 2 and unsub the same one twice',
        testSub2UnsubTwice);
    it('sub 2 and unsub more then 2',
        testSub2UnsubMore);
  });
  describe('multiple tasks unsubscribe', function() {
    it('sub 2 and unsub 1',
        testMultipleSub2Unsub1);
    it('sub 2 and unsub the same one twice',
        testMultipleSub2UnsubTwice);
    it('sub 2 and unsub more then 2',
        testMultipleSub2UnsubMore);
  });
});

var request;
function saveReq(req) {
  request = req;
}

function outputMiddleware(req, resp, next) {
  //the verify-me is added into the context by the subscribe-xxx task
  var code = req.context.get('verify-me');

  //write the secret-code to the response body
  resp.writeHead(200, { 'Content-Type': 'text/plain' });
  resp.end(code ? code.toString() : 'undefined');
  next();
}

//The middlewares running after the flow. They write the 'verify-me' to response
var middlewares = [
  outputMiddleware,
];

//The middlewares running after the flow. They write the 'verify-me' to response
//note: this is an error handler middelware
var middlewaresWithErrorHandler = [
  function(error, req, resp, next) {
    //the verify-me is added into the context by the subscribe-xxx task
    var code = req.context.get('verify-me');
    assert(error);
    //write the secret-code to the response body
    resp.writeHead(200, { 'Content-Type': 'text/plain' });
    resp.end(code ? code.toString() : 'undefined');
    next();
  },
];

//for START event, need to create flow-engine manually
var customMiddlewares = [
  function(req, resp, next) {
    req.context = createContext();
    var config = yaml.load('test/test-subscribe/subscribe-start.yaml');
    var paramResolver = require(path.join(__dirname,
                           'util/apim-param-resolver.js'))();
    var tasks = {
      mytask: require(__dirname + '/test-subscribe/mytask')({}),
    };

    var flow = new Flow(config,
        { paramResolver: paramResolver,
          context: req.context,
          tasks: tasks });

    flow.prepare(req.context, next);
    req.context.set('req', req, true);
    req.context.set('res', resp, true);

    flow.subscribe('START', function(context, next) {
      req.context.set('verify-me', 'ok-start-1');
      next();
    });
    flow.run();
  },
  outputMiddleware,
];

var customMiddlewares2 = [
  function(req, resp, next) {
    req.context = createContext();
    var config = yaml.load('test/test-subscribe/subscribe-start.yaml');
    var paramResolver = require(path.join(__dirname,
                            'util/apim-param-resolver.js'))();
    var tasks = {
      mytask: require(__dirname + '/test-subscribe/mytask')({}),
    };

    var flow = new Flow(config,
        { paramResolver: paramResolver,
          context: req.context,
          tasks: tasks });

    flow.prepare(req.context, next);
    req.context.set('req', req, true);
    req.context.set('res', resp, true);

    flow.subscribe('START', function(context, next) {
      req.context.set('verify-me', 'ok-start-1');
      next(new Error('from START event'));
    });
    flow.run();
  },
  outputMiddleware,
];

var customMiddlewares3 = [
  function(req, resp, next) {
    req.context = createContext();
    var config = yaml.load('test/test-subscribe/subscribe-start.yaml');
    var paramResolver = require(path.join(__dirname,
                            'util/apim-param-resolver.js'))();
    var tasks = {
      mytask: require(__dirname + '/test-subscribe/mytask')({}),
    };

    var flow = new Flow(config,
        { paramResolver: paramResolver,
          context: req.context,
          tasks: tasks });

    flow.prepare(req.context, next);
    req.context.set('req', req, true);
    req.context.set('res', resp, true);

    flow.subscribe('START', function(context, next) {
      req.context.set('verify-me', 'ok-start-1');
      throw new Error('from START event');
    });
    flow.run();
  },
  outputMiddleware,
];

function startCustomGateway(options, done) {
  return function(next, middleware) {
    var gatewayApp = express();
    gatewayApp.all('/*', middleware);
    gatewayApp.listen(0, function() {
      var gatewayPort = this.address().port;
      done(supertest('http://localhost:' + gatewayPort));
      next();
    });
  };
}

//START event test cases
function testSTARTEvent(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-start.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ok-start-1/, doneCB);
  }

  var go = startCustomGateway(flowOptions, saveReq);
  go(testRequest, customMiddlewares);
}

function testSTARTEventNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-start.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ok-start-1/, doneCB);
  }

  var go = startCustomGateway(flowOptions, saveReq);
  go(testRequest, customMiddlewares2);
}

function testSTARTEventThrowError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-start.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ok-start-1/, doneCB);
  }

  var go = startCustomGateway(flowOptions, saveReq);
  go(testRequest, customMiddlewares3);
}

//FINISH event test cases
function testFINISHEventNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testFINISHEventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testFINISHEventThrowError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleFINISHEventNextErrors(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-multiple.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleFINISHEventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-multiple2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleFINISHEventNextAndNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-multiple3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  //because next(error) first and next() later
  //next() override the 'verify-me' with ok
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleFINISHEventNextAndNextError2(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  //because next() first and next(error) later
  //next(error) override the 'verify-me' with error
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleFINISHEventThrow(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testNoFINISHEvent(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-but-throw.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function test3FINISHEvents(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-finish-multiple5.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  function testRequest() {
    //one FINISH event is valid
    request.get('/foo/bar').expect(200, /ev-error-1/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

//ERROR event test cases
function testERROREventNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testERROREventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testERROREventThrowError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testMultipleERROREventNextErrors(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-multiple.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testMultipleERROREventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-multiple2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testMultipleERROREventNextAndNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-multiple3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  //because next(error) first and next() later
  //next() override the 'verify-me' with ok
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testMultipleERROREventNextAndNextError2(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  //because next() first and next(error) later
  //next(error) override the 'verify-me' with error
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testMultipleERROREventThrow(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

function testNoERROREvent(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-no-throw.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw-counter' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function test3ERROREvents(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-error-multiple5.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter' } };

  //send a request and test the response
  function testRequest() {
    //only ERROR event is valid
    request.get('/foo/bar').expect(200, /ev-error-1/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

//pre event test cases
function testPreEventNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testPreEventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testPreEventThrowError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePreEventNextErrors(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre-multiple.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePreEventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre-multiple2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePreEventNextAndNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre-multiple3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  //because next(error) first and next() later
  //next() override the 'verify-me' with ok
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePreEventNextAndNextError2(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  //because next() first and next(error) later
  //next(error) override the 'verify-me' with error
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePreEventThrow(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testNoPreEvent(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-pre-but-no-pre.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

//post event test cases
function testPostEventNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testPostEventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testPostEventThrowError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePostEventNextErrors(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post-multiple.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePostEventNext(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post-multiple2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePostEventNextAndNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post-multiple3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  //because next(error) first and next() later
  //next() override the 'verify-me' with ok
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-ok-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePostEventNextAndNextError2(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  //because next() first and next(error) later
  //next(error) override the 'verify-me' with error
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultiplePostEventThrow(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post-multiple4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-throw-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-throw-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testNoPostEvent(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-post-but-no-post.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewaresWithErrorHandler);
}

//multiple events
function testFINISHPrePostEventsNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-multiple-events.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    request.get('/foo/bar').expect(200, /ev-error-3/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function test2FINISHPrePostEventsNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-multiple-events2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //totally, 5 event handlers would be executed
    request.get('/foo/bar').expect(200, /ev-error-5/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testSameEventsNextError(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-multiple-events3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //call sub 5 times, only 3 distinct events
    request.get('/foo/bar').expect(200, /ev-error-3/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testUnsupportedEvents(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/subscribe-multiple-events4.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subscribe: 'test-subscribe/subscribe-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //unsupported events
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

//unsubscribe test cases
function testSub2Unsub1(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/unsubscribe.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subunsub: 'test-subscribe/subunsub-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //sub 3 and then unsub 1 ==> 2
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testSub2UnsubTwice(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/unsubscribe2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subunsub: 'test-subscribe/subunsub-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //sub 3 and then unsub the same one twice ==> 2
    request.get('/foo/bar').expect(200, /ev-error-2/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testSub2UnsubMore(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/unsubscribe3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subunsub: 'test-subscribe/subunsub-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //sub 3 and then unsub the same one twice ==> 2
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleSub2Unsub1(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/unsubscribe-multiple.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subunsub: 'test-subscribe/subunsub-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //sub 3 and then unsub 1 ==> 2 (* 2)
    request.get('/foo/bar').expect(200, /ev-error-4/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleSub2UnsubTwice(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/unsubscribe-multiple2.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subunsub: 'test-subscribe/subunsub-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //sub 3 and then unsub the same one twice ==> 2 (* 2)
    request.get('/foo/bar').expect(200, /ev-error-4/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function testMultipleSub2UnsubMore(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-subscribe/unsubscribe3.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
      subunsub: 'test-subscribe/subunsub-counter',
      mytask: 'test-subscribe/mytask' } };

  //send a request and test the response
  function testRequest() {
    //sub 3 and then unsub the same one twice ==> 2
    request.get('/foo/bar').expect(200, /undefined/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}
