'use strict';

module.exports = function ( config ) {
    var subflow = config.subFlow;

    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('execute addSubFlow task');
        logger.debug('addSubFlow:', JSON.stringify(subflow));

        context.flow.invoke({ execute:subflow.execute}, function() {
            logger.debug('addSubFlow finished');
            next();
        });
    };
};
