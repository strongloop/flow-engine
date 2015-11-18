"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {
    var ns      = context.getCurrent();
    var logger  = ns.get('logger');

    return function (req, resp, next) {
        var text = config.target + " = " + config.value;
        var script = new vm.Script(text);
        logger.info("[message-mediation] exec '" + text + "' now");

        var sandbox = {
            context: ns,
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        script.runInContext(fakeCtx);
        next();
    };
}
