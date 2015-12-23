'use strict';

module.exports = function ( config ) {

    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('params:', JSON.stringify(config));

        logger.info('execute activity-log task');
        next();
    };
};
