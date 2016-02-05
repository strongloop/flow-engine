'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('execute subscribe-throw task');
        
        var eh = function(event, next) {
            context.set('verify-me', 'ev-throw');
            throw new Error('throw error');
        };
        var events = props.event.split(',');
        events.forEach(function (event) {
            context.flow.subscribe(event, eh);
        });
        next();
    };
};