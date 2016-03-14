'use strict';

module.exports = function (config) {
    var rev = function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER no-param-resolving policy');

        context.set(props.name, props.value);
        flow.proceed();
    };

    rev.skipParamResolving = true;
    return rev;
};
