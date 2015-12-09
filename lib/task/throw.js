"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {

    //the throw task simply calls next() with config.value as the error
    return function (req, resp, next) {
        var ns      = req.ctx;
        var logger  = ns.get('logger');

        var sandbox = {
            context: ns[req.ctxNS],
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.value;
        logger.info("[throw] evaluating '" + text + "'");
        var script = new vm.Script("var _tmp = (" + text + "); _tmp;");
        var result = script.runInContext(fakeCtx);

        logger.error("[throw] raise the error '" + JSON.stringify(result) + "'");
        next(result);
    };
}
