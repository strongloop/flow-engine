'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var logger = flow.logger;
        logger.info('execute subscribe-throw task');

        var eh = function(event, next) {
            var count = getCount(context.get('verify-me'));
            context.set('verify-me', 'ev-throw-' + (count+1));
            throw new Error('throw error');
        };
        var events = props.event.split(',');
        events.forEach(function (event) {
            flow.subscribe(event, eh);
        });
        flow.proceed();
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