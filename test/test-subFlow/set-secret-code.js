'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var code = props.code;
        var logger = flow.logger;
        logger.debug('execute set-response-code task');
        logger.debug('code:', code);

        context.set('set-secret-code', code);
        flow.proceed();
    };
};
