'use strict';

module.exports = function ( config ) {

    return function (props, context, flow) {
        var logger = flow.logger;
        logger.info('params:', JSON.stringify(props));

        logger.info('execute activity-log task');
        flow.proceed();
    };
};
