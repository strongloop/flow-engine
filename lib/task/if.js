'use strict';
var vm = require('vm');

module.exports = function (config) {

    return function (props, context, flow) {
        var logger  = flow.logger;

        function resume() {
            logger.debug('[if] resume now.');
            flow.proceed();
        }

        var text = props.condition;
        logger.debug('[if] evaluating the condition: %s', text);

        var result;
        try {
            var script = new vm.Script(text);
            result = script.runInNewContext(context);
        }
        catch (e) {
            logger.error('[if] failed to evaluate the condition: %s', e);

            var error = {
                'name': 'RuntimeError',
                'message': e.toString()
            };
            flow.fail(error);
            return;
        }

        // evaluate the condition and execute tasks
        if (result) {
            logger.debug('[if] invoke the subflow: %j', props.execute);

            flow.invoke({execute: props.execute}, resume);
        }
        else {
            logger.debug('[if] skip the subflow: %j', props.execute);

            flow.proceed();
        }
    };
};
