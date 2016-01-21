'use strict';

module.exports = function (config) {
    //the throw task simply calls next() with an object with error information
    return function (context, next) {
        var error = {
            'name': (config.name ? config.name : 'throw error'),
            'value': (config.value ? config.value : undefined),
            'message': (config.message? config.message : undefined),
        };

        var logger  = context.get('logger');
        logger.error('[throw] throwing %j', error, {});
        next(error);
    };
};
