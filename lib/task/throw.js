'use strict';
const vm = require('vm');

module.exports = function (config) {

    //the throw task simply calls next() with config.value as the error
    return function (context, next) {
        var logger  = context.get('logger');

        var sandbox = {
            context: context,
            request: context.req,
            response: context.res
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = config.value;
        logger.info('[throw] evaluating "' + text + '"');
        var result;
        var error;
        try {
            var script = new vm.Script('var _tmp = (' + text + '); _tmp;');
            result = script.runInContext(fakeCtx);
        }
        catch (e) {
            error = 'Cannot throw "' + text + '": ' + e;
        }

        if (result) {
            logger.info('[throw] raise error "' + JSON.stringify(result) + '"');
            next(result);
        }
        else {
            if (error === undefined)
                error = 'Cannot throw undefined.';

            logger.error('[throw] ' + error);
            next(error);
        }
    };
};
