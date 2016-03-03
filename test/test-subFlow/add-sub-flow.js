'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var subflow = props.subFlow;
        var logger = flow.logger;
        logger.info('execute addSubFlow task');
        logger.debug('addSubFlow:', JSON.stringify(subflow));

        flow.invoke(subflow, function() {
            logger.debug('addSubFlow finished');
            flow.proceed();
        });
    };
};

