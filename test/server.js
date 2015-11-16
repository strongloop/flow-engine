'use strict';
var createFlow = require('../index.js');
const express = require('express');


//
// The following function simulates the integration with APIm
// 
const cls = require('continuation-local-storage');

function initAPImContext(req, resp, next) {
    var apimCtx = cls.createNamespace('apim');
    apimCtx.run(function() {
	    apimCtx.set("request.verb", req.method);
	    apimCtx.set("request.path", req.path);
	    apimCtx.set("target-host", "w3.ibm.com");
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
    let apimCtx = cls.getNamespace('apim');
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

