"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {

    return function (req, resp, next) {
        var ns      = req.ctx;
        var logger  = ns.get('logger');

        var sandbox = {
            context: ns[req.ctxNS],
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.payload;
        logger.info("[response] evaluating '", text, "'");
        var script = new vm.Script("var _tmp = (" + text + "); _tmp;");
        var result = script.runInContext(fakeCtx);

        logger.info("[response] write '", result, "' to response");
        if (result.status)
            resp.status(result.status);

        if (result.message)
            resp.send(result.message);

        //TODO: how about response headers?

        next();
    };
}
