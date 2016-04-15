// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var startGateway = require('./util/start-gateway.js');

describe('ifPolicyTestingVerb', function() {

  it('ifPolicyTestingVerbPOST', ifPolicyTestingVerbPOST);
  it('ifPolicyTestingVerbGET', ifPolicyTestingVerbGET);
  it('ifPolicyTestingVerbDELETE', ifPolicyTestingVerbDELETE);
  it('ifPolicyTestingVerbHEAD', ifPolicyTestingVerbHEAD);

  it('ifPolicySyntaxError', ifPolicySyntaxError);
  it('ifPolicyReferenceError', ifPolicyReferenceError);
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


function ifPolicyTestingVerbPOST(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-if/ifPolicyTestingVerb.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'write-msg': 'test-if/mod/write-msg.js'}};

    //send a request and test the response
    function testRequest() {
        request.post('/dummy').expect(200, /POST message/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function ifPolicyTestingVerbGET(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-if/ifPolicyTestingVerb.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'write-msg': 'test-if/mod/write-msg.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy').expect(200, /GET message/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function ifPolicyTestingVerbDELETE(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-if/ifPolicyTestingVerb.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'write-msg': 'test-if/mod/write-msg.js'}};

    //send a request and test the response
    function testRequest() {
        request.delete('/dummy').expect(200, /unknown/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function ifPolicyTestingVerbHEAD(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-if/ifPolicyTestingVerb.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'write-msg': 'test-if/mod/write-msg.js'}};

    //send a request and test the response
    function testRequest() {
        request.head('/dummy').expect(200, /$^/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function ifPolicySyntaxError(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-if/ifPolicyError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'write-msg': 'test-if/mod/write-msg.js',
            'write-err': 'test-if/mod/write-err.js',
        }};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-TEST', 'syntax')
               .expect(200, 'RuntimeError: SyntaxError: Unexpected token *', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function ifPolicyReferenceError(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-if/ifPolicyError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'write-msg': 'test-if/mod/write-msg.js',
            'write-err': 'test-if/mod/write-err.js',
        }};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-TEST', 'reference')
               .expect(200, 'RuntimeError: ReferenceError: order is not defined', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

