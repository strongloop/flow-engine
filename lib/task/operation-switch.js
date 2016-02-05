'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var logger  = context.get('logger');

        function resume() {
            logger.info('[switch] subflow is complete');
            next();
        }

        var target = context.get('operation.id');
        var subflow;
        for (var c in props.case) {
            var curr = props.case[c];
            for (var idx in curr.operations) {
                if (curr.operations[idx] === target) {
                    subflow = curr.execute;
                    break;
                }
            }
            if (subflow)
                break;
        }

        if (subflow) {
            logger.info('[switch] a case is found matched for the operation "' +
                    target + '". Executing the subflow.');

            context.flow.invoke({ execute: subflow}, resume);
        }
        else {
            logger.warn('[switch] no case is matched for the operation "' +
                    target + '". Skipped.');

            next();
        }
    };
};
