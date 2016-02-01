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
        
        var events = config.event.split(',');
        events.forEach( function ( event ) {
            context.flow.subscribe(event, eh);
        });
	    next();
    };
};