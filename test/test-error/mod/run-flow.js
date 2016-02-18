'use strict';

module.exports = function (config) {
    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('[run-flow] invoke a subflow (name: %s)', props.name);

        context._flow.invoke(props.theFlow, function() {
            logger.debug('[run-flow] done');

            var body = context.get('Body');
            var v = (body ? body : '') + '|' + props.name + '(resumed)';
            context.set('Body', v);

            next();
        });
    };
};

