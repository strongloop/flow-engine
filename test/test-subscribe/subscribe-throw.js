'use strict';

module.exports = function ( config ) {

    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('execute subscribe-throw task');
        
        var eh = function(event, next) {
            context.set('verify-me', 'ev-throw');
            throw new Error('throw error');
        };
	    context.flow.subscribe(config.event, eh);
	    next();
    };
};