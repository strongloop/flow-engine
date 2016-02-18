'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('execute subscribe-throw task');
        
        var eh = function(event, next) {
            var count = getCount(context.get('verify-me'));
            context.set('verify-me', 'ev-throw-' + (count+1));
            throw new Error('throw error');
        };
        var events = props.event.split(',');
        events.forEach(function (event) {
            context._flow.subscribe(event, eh);
        });
        next();
    };
};

function getCount(value) {
    if ( value === undefined ) {
        return 0;
    } else if (value.indexOf('ev-throw') === 0) {
        let re = /ev-throw-(\d)/;
        let match = re.exec(value);
        return parseInt(match[1]);
    }
    return 0;
}