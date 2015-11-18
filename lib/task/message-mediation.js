"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {

    return function (req, resp, next) {
        var ns      = req.ctx;
        var logger  = ns.get('logger');
        var text = config.target + " = " + config.value;
        var script = new vm.Script(text);
        logger.info("[message-mediation] exec '" + text + "' now");

        var sandbox = {
            context: ns[req.ctxNS],
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        script.runInContext(fakeCtx);
        next();
    };
}
