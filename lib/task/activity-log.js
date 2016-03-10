'use strict';

module.exports = function ( config ) {

    return function (props, context, flow) {
        var logger = flow.logger;
        if (logger.debug()) {
            logger.debug('params:', JSON.stringify(props));
            logger.debug('execute activity-log task');
        }
        flow.proceed();
    };
};
