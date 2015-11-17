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
    var apimCtx = contextFactory.getCurrent();
    if (!apimCtx) {
	apimCtx = contextFactory.create();
	apimCtx.bindEmitter(req);
	apimCtx.bindEmitter(resp);
    }
    apimCtx.run(function() {
	    apimCtx.set("request.verb", req.method);
	    apimCtx.set("request.path", req.path);
	    apimCtx.set("target-host", "localhost:8888");
	    apimCtx.set("timeout", 10);
	    apimCtx.set("username", "test");
	    apimCtx.set("password", "test");
	    
	    next();
    });
}

//
// APIm's specific parameter resolver callback
//
let apimParamResolver = function(context, name, value) {
    // let apimCtx = cls.getNamespace('apim');
    let apimCtx = require('../index').Context.getCurrent();
    
    return value.replace(/\$\(([^)]+)\)/gm, function(m, g1) {
        return apimCtx.get(g1);
    });
};

var flow = createFlow({config: "flow.yaml", paramResolver: apimParamResolver});

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