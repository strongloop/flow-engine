//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';
var startGateway = require('./util/start-gateway.js');
var assert = require('assert');

describe('switchPolicyTesting', function() {

  it('switchOnVerbAndPath', switchOnVerbAndPath);
  it('switchOnOperationId1', switchOnOperationId1);
  it('switchOnOperationId2', switchOnOperationId2);
  it('switchOnOperationId3', switchOnOperationId3);
  it('switchNoCase', switchNoCase);

});

var request;
function saveReq(req) {
  request = req;
}

//To write the response
function whenFlowSucceeds(req, res, next) {
  var msg = req.context.message;
  if (msg) {
    res.writeHead(msg.statusCode, msg.headers);
    res.end(msg.body);
  }
  next();
}

//To return a 500 response with the context.error in the body
function whenFlowFails(err, req, res, next) {
  assert(err);
  res.writeHead(500, { 'Content-Type': 'text/json' });
  res.end(JSON.stringify(req.context.error));
  next();
}

//the middlewares running after the flow.
var middlewares = [ whenFlowSucceeds, whenFlowFails ];

function switchOnVerbAndPath(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-operation-switch/switchPolicyTesting.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
        //reuse the module in the 'test-if/' directory
      'write-msg': 'test-if/mod/write-msg.js' } };

  //send a request and test the response
  function testRequest() {
    request.post('/customer')
    .expect(200, /A new customer is created/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function switchOnOperationId1(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-operation-switch/switchPolicyTesting.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
        //reuse the module in the 'test-if/' directory
      'write-msg': 'test-if/mod/write-msg.js' } };

  //send a request and test the response
  function testRequest() {
    request.post('/order')
    .set('X-OP-TYPE', 'createOrder')
    .expect(200, /A new order is created/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function switchOnOperationId2(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-operation-switch/switchPolicyTesting.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
        //reuse the module in the 'test-if/' directory
      'write-msg': 'test-if/mod/write-msg.js' } };

  //send a request and test the response
  function testRequest() {
    request.post('/order')
    .set('X-OP-TYPE', 'updateOrder')
    .expect(200, /The given order is updated/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

function switchOnOperationId3(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-operation-switch/switchPolicyTesting.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
        //reuse the module in the 'test-if/' directory
      'write-msg': 'test-if/mod/write-msg.js' } };

  //send a request and test the response
  function testRequest() {
    request.delete('/order')
    .set('X-OP-TYPE', 'deleteOrder')
    .expect(500, /Deleting orders is not allowed/, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

//Cannot Get /order
function switchNoCase(doneCB) {
  //the gateway options
  var flowOptions = {
    flow: 'test/test-operation-switch/switchPolicyTesting.yaml',
    paramResolver: 'util/apim-param-resolver.js',
    baseDir: __dirname,
    tasks: {
        //reuse the module in the 'test-if/' directory
      'write-msg': 'test-if/mod/write-msg.js' } };

  //send a request and test the response
  function testRequest() {
    request.get('/order')
    .set('X-OP-TYPE', 'getOrder')
    .expect(500, doneCB);
  }

  var go = startGateway(flowOptions, saveReq);
  go(testRequest, middlewares);
}

