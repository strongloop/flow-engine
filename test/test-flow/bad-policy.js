'use strict';

module.exports = function (config) {
    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('ENTER bad policy');
        logger.info('call next first time');
        next({'name': 'next1', 'value':'foo'});
        logger.info('call next second time');
        next({'name': 'next2', 'value':'foo'});
        setTimeout(()=>{
            logger.info('call next third time');
            next({'name': 'next3', 'value':'foo'});
        }, 0);
    };
};
