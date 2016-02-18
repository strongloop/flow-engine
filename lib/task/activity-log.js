'use strict';

module.exports = function ( config ) {

    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('params:', JSON.stringify(props));

        logger.info('execute activity-log task');
        next();
    };
};
