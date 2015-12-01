'use strict';

const express = require('express');
const createFlow = require('../index.js');

//
// The following function simulates the integration with APIm
//
function initAPImContext(req, resp, next) {
    // Two options to create an APIm Context
    // Option1: use 'continuation-local-storage' module, ex:
    //   const cls = require('continuation-local-storage');
    //   var apimCtx = cls.createNamespace('apim');
    //
    // Option2: use flow-engine's context API
    //   the flow-engine's context API uses 'continuation-local-storage'
    //   module as well

    var contextFactory = require('../index').Context;
    var apimCtx = contextFactory.createContext('apim');
    apimCtx.set("request.verb", req.method);
    apimCtx.set("request.path", req.path);
    apimCtx.set("request.content-type", req.get('content-type').toLowerCase());
    apimCtx.set("target-host", "localhost:8888");
    apimCtx.set("timeout", 10);
    apimCtx.set("username", "test");
    apimCtx.set("password", "test");

    //add the X-FLOW-* headers to apim context. This is for the flow testing only
    for (var h in req.headers)
    {
        if (h.substr(0, 7) === "x-flow-")
            apimCtx.set("request." + h.toLowerCase(), req.get(h));
    }

    //The operation.id should be setup by some previous middleware
    apimCtx.set("operation.id", "updateRoute");

    req.ctx = apimCtx
    req.ctxNS = 'apim';
    next();
}

/*******************************************************************************
 * The strong gateway @7777
 */
var flow = createFlow({
        flow: "error-handler.yaml",
        paramResolver: './util/apim-param-resolver.js',
        baseDir: __dirname});

var app = express();
app.post('/*', [ initAPImContext, flow ]);

var server = app.listen(7777, function() {
    console.log("[server.js] started");
});


/*******************************************************************************
 * The simulated API server @8888
 */
var loopback = express();
loopback.all('/*', function(req, resp, next) {
    //the response status (default=200)
    var status = 200;
    var test = parseInt(req.url.substr(req.url.lastIndexOf("/") + 1));
    if (!isNaN(test))
        status = test;
    resp.status(status);

    //the response message
    var message = "Loopback: " + req.protocol + "://" + req.hostname + req.url + "\n";
    resp.send(message);
});

loopback.listen(8888);
