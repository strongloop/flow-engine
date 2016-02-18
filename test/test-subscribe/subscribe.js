'use strict';

module.exports = function (config) {

    return function (props,context, next) {
        var logger = context.get('logger');
        logger.info('execute subscribe task');
        
        var eh = function(event, next) {
            if (props['next-error']) {
                context.set('verify-me', 'ev-error');
                next(new Error('from subscribe-finish'));
            } else {
                context.set('verify-me', 'ev-ok');
                next();
            }
        };
        
        var events = props.event.split(',');
        events.forEach(function (event) {
            context._flow.subscribe(event, eh);
        });
	    next();
    };
};