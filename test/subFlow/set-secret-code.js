'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var code = props.code;
        var logger = context.get('logger');
        logger.info('execute set-response-code task');
        logger.debug('code:', code);

        context.set('set-secret-code', code);
        next();
    };
};
