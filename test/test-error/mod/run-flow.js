'use strict';

module.exports = function (config) {
    return function (context, next) {
        var logger = context.get('logger');
        logger.info('[run-flow] invoke a subflow (name: %s)', config.name);

        context.flow.invoke(config.theFlow, function() {
            logger.debug('[run-flow] done');

            var body = context.get('Body');
            var v = (body ? body : '') + '|' + config.name + '(resumed)';
            context.set('Body', v);

            next();
        });
    };
};

