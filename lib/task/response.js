'use strict';
const vm = require('vm');

module.exports = function (config) {

    return function (props, context, next) {
        var logger  = context.get('logger');

        var req = context.req;
        var resp = context.res;

        var sandbox = {
            context: context,
            request: req,
            response: resp
        };
        var fakeCtx = new vm.createContext(sandbox);

        var text = props.payload;
        logger.info('[response] evaluating "' + text + '"');

        var result;
        try {
            var script = new vm.Script('var _tmp = (' + text + '); _tmp;');
            result = script.runInContext(fakeCtx);
        }
        catch (e) {
            logger.error('[response] failed to evaluate the payload: ' + e);
            next(e);
            return;
        }

        logger.info('[response] write response: ' + JSON.stringify(result));
        //TODO: how about response headers?
        if (result.status)
            resp.status(result.status);

        if (result.message)
            resp.send(result.message);

        next();
    };
};
