"use strict";
const vm = require('vm');

module.exports = function (config) {

    return function (context, next) {
        var logger  = context.get('logger');
        var text = config.target + " = " + config.value;
        var script = new vm.Script(text);
        logger.info("[message-mediation] exec '" + text + "' now");

        var sandbox = {
            context: context,
            request: context.req,
            response: context.res
        };
        var fakeCtx = new vm.createContext(sandbox);

        script.runInContext(fakeCtx);
        next();
    };
}
