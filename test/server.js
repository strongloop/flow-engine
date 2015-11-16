'use strict';
var createFlow = require('../index.js');
const express = require('express');

let myCustomParamResolver = function(paramName, paramValue) {
    let value = paramValue+"-resolved";
    return value;
};

var flow = createFlow({config: "flow.yaml", paramResolver: myCustomParamResolver});

var app = express();
app.post('/*', flow);

var server = app.listen(7777, function() {
    console.log("[server.js] started");
});

