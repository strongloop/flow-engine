'use strict';

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER bad policy');
        logger.debug('call next first time');
        flow.fail({'name': 'next1', 'value':'foo'});
        logger.debug('call next second time');
        flow.fail({'name': 'next2', 'value':'foo'});
        setTimeout(function() {
            logger.debug('call next third time');
            flow.fail({'name': 'next3', 'value':'foo'});
        }, 0);
    };
};
