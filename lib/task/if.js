'use strict';
const vm = require('vm');

module.exports = function (config) {

    return function (context, next) {
        function resume() {
            logger.info('[if] resume now.');
            next();
        }

        var logger  = context.get('logger');

        var sandbox = {
            context: context,
            request: context.req,
            response: context.res
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.condition;
        logger.info('[if] evaluating the condition: %s', text);

        var result;
        try {
            var script = new vm.Script(text);
            result = script.runInContext(fakeCtx);
        }
        catch (e) {
            logger.error('[if] failed to evaluate the condition: %s', e);

            var error = {
                'name': 'runtime error',
                'value': 'runtime error',
                'message': e.toString()
            };
            next(error);
            return;
        }

        // evaluate the condition and execute tasks
        if (result) {
            logger.info('[if] invoke the subflow: %j', config.execute, {});

            context.flow.invoke({execute: config.execute}, resume);
        }
        else {
            logger.info('[if] skip the subflow: %j', config.execute, {});

            next();
        }
    };
};
