'use strict';

module.exports = function (config) {
    //the throw task simply calls next() with an object with error information
    return function (props, context, next) {
        var error = {
            'name': (props.name ? props.name : 'throw error'),
            'value': (props.value ? props.value : undefined),
            'message': (props.message? props.message : undefined),
        };

        var logger  = context.get('logger');
        logger.error('[throw] throwing %j', error);
        next(error);
    };
};
