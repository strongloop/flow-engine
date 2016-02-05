'use strict';
const vm = require('vm');

module.exports = function (config) {

    return function (props, context, next) {
        var logger  = context.get('logger');
        var text = props.target + ' = ' + props.value;
        var script = new vm.Script(text);
        logger.info('[message-mediation] exec "' + text + '" now');

        var sandbox = {
            context: context,
            request: context.req,
            response: context.res
        };
        var fakeCtx = new vm.createContext(sandbox);

        script.runInContext(fakeCtx);
        next();
    };
};
