"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {
    var ns      = context.getCurrent();
    var logger  = ns.get('logger');

    return function (req, resp, next) {
        var text = config.payload;
        var script = new vm.Script(text);
        logger.info("[response] evaluate '" + text + "'");

        var sandbox = {
            context: ns,
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
