'use strict';

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.info('ENTER bad policy');
        logger.info('call next first time');
        flow.fail({'name': 'next1', 'value':'foo'});
        logger.info('call next second time');
        flow.fail({'name': 'next2', 'value':'foo'});
        setTimeout(()=>{
            logger.info('call next third time');
            flow.fail({'name': 'next3', 'value':'foo'});
        }, 0);
    };
};
