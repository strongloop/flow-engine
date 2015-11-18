'use strict';
var createFlow = require('../index.js');
const express = require('express');

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

    //The operation.id should be setup by some previous middleware
    apimCtx.set("operation.id", "updateRoute");
    req.ctx = apimCtx
    req.ctxNS = 'apim';
    next();
}

var flow = createFlow({flow: "flow.yaml", paramResolver: './apim-param-resolver.js', baseDir: __dirname});

var app = express();
app.post('/*', [ initAPImContext, flow ]);

var server = app.listen(7777, function() {
    console.log("[server.js] started");
});

/** an echo/loopback service **/
var loopback = express();
loopback.all('/*', function(req, resp, next) {
    let message = "Loopback: " + req.protocol + "://" + req.hostname + req.url + "\n";
    resp.send(message);
});
loopback.listen(8888);
