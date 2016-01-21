'use strict';
var startGateway = require('./util/start-gateway.js');

//subflow testcases:
describe('flowAndErrorHandler', function() {

  describe('positiveCases', function() {
    //two 'call' policies in the same flow
    it('testTwoConsecutiveCallPolicies', testTwoConsecutiveCallPolicies);

    //A 'call' policy to execute a subflow that contains another 'call'
    it('testNestedCallPolicies', testNestedCallPolicies);
  });

  //shit happens, but fixed by the error handlers
  describe('recoverableErrors', function() {
    //The error in main is recovered by a case in the local error handler
    it('testMainErrorRecoveredByLEH1', testMainErrorRecoveredByLEH1);

    //The error in main is recovered by default case in the local error handler
    it('testMainErrorRecoveredByLEH2', testMainErrorRecoveredByLEH2);

    //The error in main is recovered by the global error handler
    it('testMainErrorRecoveredByGEH', testMainErrorRecoveredByGEH);

    //The error in subflow is recovered by the polcy's local error handler
    it('testSubflowErrorRecoveredByPolicy', testSubflowErrorRecoveredByPolicy);

    //The error in subflow is recovered by the parent's local error handler
    it('testSubflowErrorRecoveredByParent', testSubflowErrorRecoveredByParent);

    //The error in subflow is recovered by the global error handler
    it('testSubflowErrorRecoveredByGEH', testSubflowErrorRecoveredByGEH);

    //more than one error in subflow are recovered by the parent
    it('testSubflowTwoErrorsHandled1', testSubflowTwoErrorsHandled1);
    it('testSubflowTwoErrorsHandled2', testSubflowTwoErrorsHandled2);
    it('testSubflowTwoErrorsHandled3', testSubflowTwoErrorsHandled3);
    it('testSubflowTwoErrorsHandled4', testSubflowTwoErrorsHandled4);

    //Two errors. One is recovered locally while the other is handled globally
    it('testSubflowTwoErrorsHandledByGEH1', testSubflowTwoErrorsHandledByGEH1);
    it('testSubflowTwoErrorsHandledByGEH2', testSubflowTwoErrorsHandledByGEH2);

    //A subflow in global error handler fails, and is recovered
    it('testRecoverTheSubflowErrorInGEH', testRecoverTheSubflowErrorInGEH);
  });

  //unhandled errors
  describe('errorsCannotBeFixed', function() {
    //uncaught error in main
    it('testUncaughtErrorInMain', testUncaughtErrorInMain);

    //uncaught error in local error handler
    it('testUncauthtErrorInLEH', testUncauthtErrorInLEH);

    //uncaught error in global error handler
    it('testUncauthtErrorInGEH', testUncauthtErrorInGEH);

    //uncaught error in subflow
    it('testUncaughtErrorInSubflow1', testUncaughtErrorInSubflow1);
    it('testUncaughtErrorInSubflow2', testUncaughtErrorInSubflow2);
    it('testUncaughtErrorInSubflow3', testUncaughtErrorInSubflow3);
  });

});

var request;
function saveReq(req) {
    request = req;
}

//To return a 200 response
function whenFlowSucceeds(req, res, next) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(req.context.get('Body'));
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



function testTwoConsecutiveCallPolicies(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testTwoConsecutiveCallPolicies.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy').expect(200,
                '|MT1|SF1T1|MT3|SF2T1', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testNestedCallPolicies(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testNestedCallPolicies.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy').expect(200,
                '|MT1|SF1T1|SF2T1|SF2T2|SF1T3|MT3', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testMainErrorRecoveredByLEH1(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testMainErrorRecoveredByLEH.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-COLOR-HDR', 'indigo')
               .expect(200, '|MT1|LH1C2T1|MT3', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testMainErrorRecoveredByLEH2(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testMainErrorRecoveredByLEH.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-COLOR-HDR', 'stone')
               .expect(200, '|MT1|LHDT1|LHDT2|MT3', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testMainErrorRecoveredByGEH(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testMainErrorRecoveredByGEH.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-COLOR-HDR', 'yellow')
               .expect(200, '|MT1|GH1C1T1', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowErrorRecoveredByPolicy(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    var expect =
        '|MT1|SF1T3|SF2T6|SF3T8|LH3Cf|SF3T9|SF3T10|SF2T7|SF1T4|SF1T5|MT2';
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'f')
               .expect(200, expect, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowErrorRecoveredByParent(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'd')
               .expect(200,
                       '|MT1|SF1T3|SF2T6|SF3T8|LH1Cd|SF1T4|SF1T5|MT2',
                       doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowErrorRecoveredByGEH(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'z')
               .expect(200, '|MT1|SF1T3|SF2T6|SF3T8|GHD', doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowTwoErrorsHandled1(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'f')
               .set('X-SECRET2-HDR', 'b')
               .expect(200,
                       '|MT1|SF1T3|SF2T6|SF3T8|LH3Cf|SF3T9|LH0Cb|MT2',
                       doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowTwoErrorsHandled2(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    var expect =
        '|MT1|SF1T3|SF2T6|SF3T8|LH1CeT11|LL0Ch|LH1CeT12|SF1T4|SF1T5|MT2';
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'e')
               .set('X-SECRET3-HDR', 'h')
               .expect(200, expect, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowTwoErrorsHandled3(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    var expect =
        '|MT1|SF1T3|SF2T6|SF3T8|LH1CeT11|LH0Ca|MT2';
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'e')
               .set('X-SECRET3-HDR', 'a')
               .expect(200, expect, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowTwoErrorsHandled4(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    var expect =
        '|MT1|SF1T3|SF2T6|SF3T8|LH1CeT11|LH1CeT12|SF1T4|SF1T5|MT2';
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'e')
               .expect(200, expect, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowTwoErrorsHandledByGEH1(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'f')
               .set('X-SECRET2-HDR', 'z')
               .expect(200,
                       '|MT1|SF1T3|SF2T6|SF3T8|LH3Cf|SF3T9|GHD',
                       doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSubflowTwoErrorsHandledByGEH2(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'e')
               .set('X-SECRET3-HDR', 'z')
               .expect(200,
                       '|MT1|SF1T3|SF2T6|SF3T8|LH1CeT11|GHD',
                       doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testRecoverTheSubflowErrorInGEH(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testSubflowErrorRecover.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    var expect =
        '|MT1|SF1T3|SF2T6|SF3T8|GHCpT1|SFG1T3|LHG1CqrT1|SFG1T4|GHCpT2';
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'p')
               .set('X-SECRET4-HDR', 'r')
               .expect(200, expect, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testUncaughtErrorInMain(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testUncaughtError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'a')
               .set('X-SECRET5-HDR', 'whatever')
               .expect(500, /whatever.*secret 5/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testUncauthtErrorInLEH(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testUncaughtError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'e')
               .set('X-SECRET3-HDR', 'z')
               .expect(500, /z.*secret 3/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testUncauthtErrorInGEH(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testUncaughtError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'p')
               .set('X-SECRET4-HDR', 'z')
               .expect(500, /z.*secret 4/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testUncaughtErrorInSubflow1(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testUncaughtError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'z')
               .expect(500, /z.*secret"/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testUncaughtErrorInSubflow2(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testUncaughtError.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .set('X-SECRET-HDR', 'g')
               .set('X-SECRET2-HDR', 'z')
               .expect(500, /z.*secret 2/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testUncaughtErrorInSubflow3(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-error/testUncaughtErrorInSubflow3.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'call': 'test-error/mod/call.js',
            'append-code': 'test-error/mod/append-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/dummy')
               .expect(500, /b.*catch me if you can/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

