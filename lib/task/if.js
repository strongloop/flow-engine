'use strict';
const vm = require('vm');

module.exports = function (config) {

    return function (props, context, flow) {
        var logger  = flow.logger;

        function resume() {
            logger.info('[if] resume now.');
            flow.proceed();
        }

        var text = props.condition;
        logger.info('[if] evaluating the condition: %s', text);

        var result;
        try {
            var script = new vm.Script(text);
            result = script.runInNewContext(context);
        }
        catch (e) {
            logger.error('[if] failed to evaluate the condition: %s', e);

            var error = {
                'name': 'runtime error',
                'value': 'runtime error',
                'message': e.toString()
            };
            flow.fail(error);
            return;
        }

        // evaluate the condition and execute tasks
        if (result) {
            logger.info('[if] invoke the subflow: %j', props.execute);

            flow.invoke({execute: props.execute}, resume);
        }
        else {
            logger.info('[if] skip the subflow: %j', props.execute);

            flow.proceed();
        }
    };
};
