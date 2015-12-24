'use strict';
var startGateway = require('./util/start-gateway.js');
const should        = require('should');

describe('use invoke() API of flow-engine to execute a sub-flow', function() {
   describe('custom addSubFlow task', function() {
       describe('green path subFlow', function() {
           it('should correctly execute the newly-added subFlow', function(done) {
               var request;
               startGateway(
                       { flow: 'test/subFlow/add-subflow.yaml',
                           paramResolver: 'util/apim-param-resolver.js',
                           baseDir: __dirname,
                           tasks: { 'add-sub-flow': 'subFlow/add-sub-flow.js',
                                    'set-secret-code': 'subFlow/set-secret-code.js'}},
                       function(req) {
                           request = req;
                       })( function () {
                           request.get('/foo/bar').expect(200, /okay/, done);
                       }, [function (req, resp, next) {
                           resp.writeHead(200, {'Content-Type': 'text/plain'});
                           resp.end('okay');
                           //set-secret-code in the sub-flow should add 'set-secret-code' into the context
                           should(req.context.get('set-secret-code')).exactly(777);
                           next();
                       }]);
           });
       });
       describe('error path subFlow', function() {
           it('should execute subflow and go to the default error path', function(done) {
               var request;
               startGateway(
                       { flow: 'test/subFlow/add-subflow-with-error.yaml',
                           paramResolver: 'util/apim-param-resolver.js',
                           baseDir: __dirname,
                           tasks: { 'add-sub-flow': 'subFlow/add-sub-flow.js',
                                    'set-secret-code': 'subFlow/set-secret-code.js'}},
                       function(req) {
                           request = req;
                       })( function () {
                           request.get('/foo/bar').expect(200, /okay/, done);
                       }, [function (req, resp, next) {
                           resp.writeHead(200, {'Content-Type': 'text/plain'});
                           resp.end('okay');
                           //set-secret-code in the sub-flow should add 'set-secret-code' into the context
                           should(req.context.get('set-secret-code')).exactly(888);
                           next();
                       }]);
           });
           it('should execute subflow and go to the specific error path', function(done) {
               var request;
               startGateway(
                       { flow: 'test/subFlow/add-subflow-with-error2.yaml',
                           paramResolver: 'util/apim-param-resolver.js',
                           baseDir: __dirname,
                           tasks: { 'add-sub-flow': 'subFlow/add-sub-flow.js',
                                    'set-secret-code': 'subFlow/set-secret-code.js'}},
                       function(req) {
                           request = req;
                       })( function () {
                           request.get('/foo/bar').expect(200, /okay/, done);
                       }, [function (req, resp, next) {
                           resp.writeHead(200, {'Content-Type': 'text/plain'});
                           resp.end('okay');
                           //set-secret-code in the sub-flow should add 'set-secret-code' into the context
                           should(req.context.get('set-secret-code')).exactly(999);
                           next();
                       }]);
           });
       });
       describe('subFlow contains if', function() {
           it('should execute the sepcific error flow in if', function(done) {
               var request;
               startGateway(
                       { flow: 'test/subFlow/add-subflow-with-error3.yaml',
                           paramResolver: 'util/apim-param-resolver.js',
                           baseDir: __dirname,
                           tasks: { 'add-sub-flow': 'subFlow/add-sub-flow.js',
                                    'set-secret-code': 'subFlow/set-secret-code.js'}},
                       function(req) {
                           request = req;
                       })( function () {
                           request.get('/foo/bar').expect(200, /okay/, done);
                       }, [function (req, resp, next) {
                           resp.writeHead(200, {'Content-Type': 'text/plain'});
                           resp.end('okay');
                           //set-secret-code in the sub-flow should add 'set-secret-code' into the context
                           should(req.context.get('set-secret-code')).exactly(444);
                           next();
                       }]);
           });
           it('should execute the sepcific error flow in subflow', function(done) {
               var request;
               startGateway(
                       { flow: 'test/subFlow/add-subflow-with-error4.yaml',
                           paramResolver: 'util/apim-param-resolver.js',
                           baseDir: __dirname,
                           tasks: { 'add-sub-flow': 'subFlow/add-sub-flow.js',
                                    'set-secret-code': 'subFlow/set-secret-code.js'}},
                       function(req) {
                           request = req;
                       })( function () {
                           request.get('/foo/bar').expect(200, /okay/, done);
                       }, [function (req, resp, next) {
                           resp.writeHead(200, {'Content-Type': 'text/plain'});
                           resp.end('okay');
                           //set-secret-code in the sub-flow should add 'set-secret-code' into the context
                           should(req.context.get('set-secret-code')).exactly(999);
                           next();
                       }]);
           });
       });
       describe('add subFlow: only execute', function() {
           it('should execute the sepcific error flow in if', function(done) {
               var request;
               startGateway(
                       { flow: 'test/subFlow/add-subflow-with-error3.yaml',
                           paramResolver: 'util/apim-param-resolver.js',
                           baseDir: __dirname,
                           tasks: { 'add-sub-flow': 'subFlow/add-sub-flow2.js',
                                    'set-secret-code': 'subFlow/set-secret-code.js'}},
                       function(req) {
                           request = req;
                       })( function () {
                           request.get('/foo/bar').expect(200, /okay/, done);
                       }, [function (req, resp, next) {
                           resp.writeHead(200, {'Content-Type': 'text/plain'});
                           resp.end('okay');
                           //set-secret-code in the sub-flow should add 'set-secret-code' into the context
                           should(req.context.get('set-secret-code')).exactly(444);
                           next();
                       }]);
           });
       });
    });

});
