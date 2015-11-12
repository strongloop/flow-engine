'use strict';
var createFlow = require('../index.js');
const express = require('express');

var flow = createFlow({config: "flow.yaml"});

var app = express();
app.post('/*', flow);

var server = app.listen(7777, function() {
    console.log("[server.js] started");
});

