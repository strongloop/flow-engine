'use strict';

module.exports = function ( config ) {

    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('execute subunsub task');
        var eh = function(event, next) {
	        if (config['next-error']) {
	            let count = getCount(context.get('verify-me'));
	            context.set('verify-me', 'ev-error-' + (count+1));
	            next(new Error('from subscribe-finish-counter'));
	        } else {
	            let count = getCount(context.get('verify-me'));
	            context.set('verify-me', 'ev-ok-' + (count+1));
	            next();
	        }
        };
        var subevents = config['sub-event'].split(',');
        subevents.forEach( function ( event ) {
            context.flow.subscribe(event, eh);
        });
        var unsubevents = config['unsub-event'].split(',');
        unsubevents.forEach( function ( event ) {
            context.flow.unsubscribe(event, eh);
        });
	    next();
    };
};

function getCount(value) {
    if ( value === undefined ) {
        return 0;
    } else if (value.indexOf('ev-error') === 0) {
        let re = /ev-error-(\d)/;
        let match = re.exec(value);
        return parseInt(match[1]);
    } else if ( value.indexOf('ev-ok') === 0) {
        let re = /ev-ok-(\d)/;
        let match = re.exec(value);
        return parseInt(match[1]);
    }
    return 0;
}