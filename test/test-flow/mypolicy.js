'use strict';

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER mypolicy policy');

        context.set(props.name, props.value);
        if (props.stop === true) {
            flow.stop();
        } else {
            flow.proceed();
        }
    };
};
