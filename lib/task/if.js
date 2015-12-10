"use strict";
const vm = require('vm');

module.exports = function (config) {

    return function (context, next) {
        function resume() {
            logger.info("[if] resume now.");
            next();
        };

        var logger  = context.get('logger');
        logger.info("[if] evaluate the condition: " + config.condition);

        var sandbox = {
            context: context,
            request: context.req,
            response: context.res
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.condition;
        logger.info("[if] evaluating the condition: ", text);
        var script = new vm.Script(text);
        var result = script.runInContext(fakeCtx);

        // evaluate the condition statement and execute tasks if condition is true
        if (result) {
            logger.info("[if] invoke the subflow: ", JSON.stringify(config.execute, undefined, 2));
            context.flow.invoke(config.execute, resume);
        } else {
            logger.info("[if] skip the subflow: ", JSON.stringify(config.execute, undefined, 2));
            next();
        }
    };
}
