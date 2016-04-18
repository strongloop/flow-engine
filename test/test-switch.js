// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var startGateway = require('./util/start-gateway.js');

describe('switchPolicyTesting', function() {
  //first switch (match default)
  it('switchPolicyMatchDefault', switchPolicyMatchDefault);

  //first switch (match case), second switch (match case)
  it('switchPolicyMatchMatch', switchPolicyMatchMatch);

  //first switch (match case), second switch (no default no match)
  it('switchPolicyMatchNoDefault', switchPolicyMatchNoDefault);
});

var request;
function saveReq(req) {
    request = req;
}

//To write the response
function whenFlowSucceeds(req, res, next) {
    var msg = req.context.message;
    res.writeHead(msg.statusCode);
    res.end(JSON.stringify(msg.body));
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


function switchPolicyMatchDefault(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-switch/switchPolicyTesting.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-msg': 'test-switch/mod/add-msg.js',
            'write-err': 'test-switch/mod/write-err.js',
        }};

    //send a request and test the response
    function testRequest() {
        request.get('/foo')
            .set('X-BOOL', 'boolean')
            .expect(200,
                    /^"Invalid bool: The x-bool \'boolean\' is not accepted"$/,
                    doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function switchPolicyMatchMatch(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-switch/switchPolicyTesting.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-msg': 'test-switch/mod/add-msg.js',
            'write-err': 'test-switch/mod/write-err.js',
        }};

    //send a request and test the response
    function testRequest() {
        request.get('/foo')
            .set('X-BOOL', 'true')
            .set('X-INT', '-100')
            .expect(200,
                    /^{"bool":true,"int":"negative"}$/,
                    doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function switchPolicyMatchNoDefault(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-switch/switchPolicyTesting.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-msg': 'test-switch/mod/add-msg.js',
            'write-err': 'test-switch/mod/write-err.js',
        }};

    //send a request and test the response
    function testRequest() {
        request.get('/foo')
            .set('X-BOOL', 'false')
            .set('X-INT', 'Not a number')
            .expect(200,
                    /^{"bool":false}$/,
                    doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

