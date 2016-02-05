'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('execute mytask task');
        next();
    };
};