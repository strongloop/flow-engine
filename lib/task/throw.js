'use strict';

module.exports = function (config) {
    //the throw task simply calls next() with an object with error information
    return function (props, context, flow) {
        var error = {
            'name': (props.name ? props.name + '' : 'ThrowError'),
            'message': (props.message ? props.message + '' : undefined),
        };

        var logger  = flow.logger;
        logger.error('[throw] throwing %j', error);
        flow.fail(error);
    };
};
