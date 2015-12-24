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
        try {
            var script = new vm.Script('var _tmp = (' + text + '); _tmp;');
            result = script.runInContext(fakeCtx);
        }
        catch (e) {
            result = 'Cannot throw "' + text + '": ' + e;
            logger.error(result);
        }
        finally {
            if ( !result ) {
                result = 'Cannot throw undefined.';
                logger.error(result);
            }

            logger.info('[throw] ' + result);
            next(result);
        }
    };
};
