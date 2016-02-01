'use strict';

module.exports = function ( config ) {

    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('execute subscribe task');
        
        var eh = function(event, next) {
	        if (config['next-error']) {
	            context.set('verify-me', 'ev-error');
	            next(new Error('from subscribe-finish'));
	        } else {
	            context.set('verify-me', 'ev-ok');
	            next();
	        }
        };
	    context.flow.subscribe(config.event, eh);
	    next();
    };
};