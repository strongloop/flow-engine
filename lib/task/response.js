"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {

    return function (req, resp, next) {
        var ns      = req.ctx;
        var logger  = ns.get('logger');
        var text = config.payload;
        var script = new vm.Script(text);
        logger.info("[response] evaluate '" + text + "'");

        var sandbox = {
            context: ns[req.ctxNS],
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        var payload = script.runInContext(fakeCtx);
        logger.info("[response] write '" + JSON.stringify(payload) + "' to response");
        if (payload.status)
            resp.status(payload.status);
        if (payload.message)
            resp.send(payload.message);

        next();
    };
}
