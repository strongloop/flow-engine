'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var subflow = { 'execute': props.execute };
        var logger = flow.logger;
        logger.info('[call] calling "%s" now', props.name);

        flow.invoke(subflow, function() {
            logger.info('[call] "%s" completed', props.name);
            flow.proceed();
        });
    };
};

