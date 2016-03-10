'use strict';

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('[run-flow] invoke a subflow (name: %s)', props.name);

        flow.invoke(props.theFlow, function() {
            logger.debug('[run-flow] done');

            var body = context.get('Body');
            var v = (body ? body : '') + '|' + props.name + '(resumed)';
            context.set('Body', v);

            flow.proceed();
        });
    };
};

