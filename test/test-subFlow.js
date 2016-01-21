'use strict';
var startGateway = require('./util/start-gateway.js');

//subflow testcases:
describe('use the invoke API of flow-engine to execute a subflow', function() {
    describe('custom addSubFlow task', function() {
        describe('green path subflow', function() {
            it('should correctly execute the newly-added subflow',
                testNewlyAddedSubflow);
        });

        describe('error path subflow', function() {
            it('should execute subflow and go to the default error path',
                testDefaultErrorPath);
            it('should execute subflow and go to the specific error path',
                testSpecificErrorPath);
        });

        describe('subflow contains if', function() {
            it('should execute the specific error flow in the if task',
                testSpecificErrorFlowInTask);
            it('should execute the specific error flow in the upper flow',
                testSpecificErrorFlowInUpperFlow);
        });

        describe('add subflow: only execute', function() {
            it('should execute the specific error flow in if',
                testExecuteASubflowWithNoCatch);
        });
    });
});


var request;
function saveReq(req) {
    request = req;
}

//The middlewares running after the flow. They write the secret code to response
var middlewares = [
    function (req, resp, next) {
        //the secret-code is added into the context by the subflow
        var code = req.context.get('set-secret-code');

        //write the secret-code to the response body
        resp.writeHead(200, {'Content-Type': 'text/plain'});
        resp.end(code.toString());
        next();
    }
];

function testNewlyAddedSubflow(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/subFlow/add-subflow.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-sub-flow': 'subFlow/add-sub-flow.js',
            'set-secret-code': 'subFlow/set-secret-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /777/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testDefaultErrorPath(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/subFlow/add-subflow-with-error.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-sub-flow': 'subFlow/add-sub-flow.js',
            'set-secret-code': 'subFlow/set-secret-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /888/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSpecificErrorPath(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/subFlow/add-subflow-with-error2.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-sub-flow': 'subFlow/add-sub-flow.js',
            'set-secret-code': 'subFlow/set-secret-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /999/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSpecificErrorFlowInTask(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/subFlow/add-subflow-with-error3.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-sub-flow': 'subFlow/add-sub-flow.js',
            'set-secret-code': 'subFlow/set-secret-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /444/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testSpecificErrorFlowInUpperFlow(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/subFlow/add-subflow-with-error4.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-sub-flow': 'subFlow/add-sub-flow.js',
            'set-secret-code': 'subFlow/set-secret-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /999/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

function testExecuteASubflowWithNoCatch(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/subFlow/add-subflow-with-error3.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'add-sub-flow': 'subFlow/add-sub-flow2.js',
            'set-secret-code': 'subFlow/set-secret-code.js'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /444/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewares);
}

