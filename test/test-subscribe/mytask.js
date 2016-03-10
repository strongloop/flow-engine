'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('execute mytask task');
        flow.proceed();
    };
};