'use strict';
var startGateway = require('./util/start-gateway.js');

//subscribe testcases:
describe('flow.subscribe()', function() {
    //verify the FINISH event
    //1. 1 FINISH subscriber: the event handler calls next(error)
    //2. 1 FINISH subscriber: the event handler calls next()
    //3. 1 FINISH subscriber: the event handler throws error
    //4. 2 FINISH subscribers: the event handlers call next(error)
    //5. 2 FINISH subscribers: the event handlers call next()
    //6. 2 FINISH subscribers: 1st calls next(error) and 2nd calls next()
    //7. 2 FINISH subscribers: 1st calls next() and 2nd calls next(error)
    //8. 2 FINISH subscribers: both throw errors
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
        });
    });
});


var request;
function saveReq(req) {
    request = req;
}

//The middlewares running after the flow. They write the 'verify-me' to response
var middlewares = [
    function (req, resp, next) {
        //the verify-me is added into the context by the subscribe-xxx task
        var code = req.context.get('verify-me');

        //write the secret-code to the response body
        resp.writeHead(200, {'Content-Type': 'text/plain'});
        resp.end(code.toString());
        next();
    }
];

//The middlewares running after the flow. They write the 'verify-me' to response
//note: this is an error handler middelware
var middlewaresWithErrorHandler = [
    function (error, req, resp, next) {
        //the verify-me is added into the context by the subscribe-xxx task
        var code = req.context.get('verify-me');

        //write the secret-code to the response body
        resp.writeHead(200, {'Content-Type': 'text/plain'});
        resp.end(code.toString());
        next();
    }
];

//FINISH event test cases
function testFINISHEventNextError(doneCB) {
    //the gateway options
    var flowOptions = {
        flow: 'test/test-subscribe/subscribe-finish.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname,
        tasks: {
            'subscribe': 'test-subscribe/subscribe'}};

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
            'subscribe': 'test-subscribe/subscribe'}};

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
            'subscribe': 'test-subscribe/subscribe-throw'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-throw-counter'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /ev-throw-2/, doneCB);
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
            'subscribe': 'test-subscribe/subscribe'}};

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
            'subscribe': 'test-subscribe/subscribe'}};

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
            'subscribe': 'test-subscribe/subscribe-throw'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-counter'}};

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
            'subscribe': 'test-subscribe/subscribe-throw-counter'}};

    //send a request and test the response
    function testRequest() {
        request.get('/foo/bar').expect(200, /ev-throw-2/, doneCB);
    }

    var go = startGateway(flowOptions, saveReq);
    go(testRequest, middlewaresWithErrorHandler);
}
