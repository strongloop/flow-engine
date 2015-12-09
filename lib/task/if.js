"use strict";
const context = require('../context');
const vm = require('vm');

module.exports = function (config) {

    return function (req, resp, next, invoke) {
        function resume() {
            logger.info("[if] resume now.");
            next();
        };

        var ns      = req.ctx;
        var logger  = ns.get('logger');

        var sandbox = {
            context: ns[req.ctxNS],
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.condition;
        logger.info("[if] evaluating the condition: ", text);
        var script = new vm.Script(text);
        var result = script.runInContext(fakeCtx);

        // evaluate the condition statement and execute tasks if condition is true
        if (result) {
            logger.info("[if] invoke the subflow: ", JSON.stringify(config.execute, undefined, 2));
            invoke(config.execute, resume);
        } else {
            logger.info("[if] skip the subflow: ", JSON.stringify(config.execute, undefined, 2));
            next();
        }
    };
}
