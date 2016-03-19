// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var startGateway = require('./util/start-gateway.js');
var auth = require('http-auth');

describe('invokePolicy', function() {

  it('invokePolicyReverseProxyPOST', invokePolicyReverseProxyPOST);
  it('invokePolicyReverseProxyGET', invokePolicyReverseProxyGET);
  it('invokePolicyBadPort', invokePolicyBadPort);
  it('invokePolicyTimeout', invokePolicyTimeout);
  it('invokePolicyBasicAuthOK', invokePolicyBasicAuthOK);
  it('invokePolicyBasicAuthNG', invokePolicyBasicAuthNG);

});

var request;
function saveReq(req) {
    request = req;
}

//To write the response
function whenFlowSucceeds(req, res, next) {
    var msg = req.context.message;
    res.writeHead(msg.statusCode, msg.headers);
    res.end(msg.body);
    next();
}

//To return a 500 response with the context.error in the body
function whenFlowFails(err, req, res, next) {
    res.writeHead(500, {'Content-Type': 'text/json'});
    res.end(JSON.stringify(req.context.error));
    next();
}

//the middlewares running after the flow.
var middlewares = [whenFlowSucceeds, whenFlowFails];

//act as back server
function backendServer(req, res) {
    res.write(req.method + ' ' + req.originalUrl);
    res.end();
}

function backendServer2Sec(req, res) {
    setTimeout(function() {
            res.write(req.method + ' ' + req.path);
            res.end();
        }, 2000);
}

var basic = auth.basic(
        { realm: 'super secret stuff' },
        function(name, pwd, callback) {
            callback(name === 'admin' && pwd === 'smersh');
        });
function backendServerProtected(req, res) {
    res.send('basic auth works');
}

function invokePolicyReverseProxyPOST(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-invoke/invokeReverseProxy.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname
    };

    //send a request and test the response
    function testRequest() {
        request.post('/foo/bar').expect(200, /POST \/\?msg\=hello/, doneCB);
    }

    var go = startGateway(flowOptions,
            { callback: backendServer },
            saveReq);
    go(testRequest, middlewares);
}

function invokePolicyReverseProxyGET(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-invoke/invokeReverseProxy.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname
    };

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /GET \/\?msg\=hello/, doneCB);
    }

    var go = startGateway(flowOptions,
            { callback: backendServer },
            saveReq);
    go(testRequest, middlewares);
}

//server takes 2 seconds to return while the timeout is set to 1
function invokePolicyTimeout(doneCB) {
    /* jshint validthis: true */
    this.timeout(5000);
    //the gateway options
    var flowOptions = {
        flow: 'test/test-invoke/invokeTimeout.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname
    };

    //send a request and test the response
    function testRequest() {
        request.post('/foo/timeout').expect(500, doneCB);
    }

    var go = startGateway(flowOptions,
            { callback: backendServer2Sec },
            saveReq);
    go(testRequest, middlewares);
}

//we don't have a backend service at localhost:9999
function invokePolicyBadPort(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-invoke/invokeBadPort.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname
    };

    //send a request and test the response
    function testRequest() {
        request.post('/foo/bar')
            .expect(500, /Error: connect ECONNREFUSED/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function invokePolicyBasicAuthOK(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-invoke/invokeBasicAuth.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname
    };

    //send a request and test the response
    function testRequest() {
        request.post('/Good').expect(200, /basic auth works/, doneCB);
    }

    var go = startGateway(flowOptions,
            { callback: backendServerProtected,
              middleware: auth.connect(basic) },
            saveReq);
    go(testRequest, middlewares);
}

function invokePolicyBasicAuthNG(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-invoke/invokeBasicAuth.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname
    };

    //send a request and test the response
    function testRequest() {
        request.post('/NG')
            .expect(401, /Unauthorized/, doneCB);
    }

    var go = startGateway(flowOptions,
            { callback: backendServerProtected,
              middleware: auth.connect(basic) },
            saveReq);
    go(testRequest, middlewares);
}

