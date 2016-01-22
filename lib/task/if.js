'use strict';
const vm = require('vm');

module.exports = function (config) {

    return function (context, next) {
        var logger  = context.get('logger');

        function resume() {
            logger.info('[if] resume now.');
            next();
        }

        var sandbox = {
            context: context,
            request: context.req,
            response: context.res
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.condition;
        logger.info('[if] evaluating the condition: ' + text);

        var result;
        try {
            var script = new vm.Script(text);
            result = script.runInContext(fakeCtx);
        }
        catch (e) {
            logger.error('[if] failed to evaluate the condition: ' + e);
            next(e);
            return;
        }

        // evaluate the condition and execute tasks
        if (result) {
            logger.info('[if] invoke the subflow: ' +
                    JSON.stringify(config.execute, undefined, 2));

            context.flow.invoke({execute:config.execute}, resume);
        } else {
            logger.info('[if] skip the subflow: ' +
                    JSON.stringify(config.execute, undefined, 2));

            next();
        }
    };
};
