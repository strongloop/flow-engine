'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var subflow = { 'execute': props.execute };
        var logger = context.get('logger');
        logger.info('[call] calling "%s" now', props.name);

        context._flow.invoke(subflow, function() {
            logger.info('[call] "%s" completed', props.name);
            next();
        });
    };
};

