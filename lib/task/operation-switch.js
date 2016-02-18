'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var logger  = context.get('logger');

        function resume() {
            logger.info('[switch] Subflow is complete');
            next();
        }

        var actualOpId = context.get('api.operationId');
        var actualVerb = context.get('request.verb');
        var actualPath = context.get('request.path');
        logger.info('[switch] Matching %s %s (%s)',
                actualVerb, actualPath, actualOpId);

        var subflow;
        for (var c in props.case) {
            var curr = props.case[c];
            for (var idx in curr.operations) {
                var expect = curr.operations[idx];
                if (typeof expect === 'string') {
                    if (expect === actualOpId) {
                        subflow = curr.execute;
                        break;
                    }
                }
                else if (typeof expect === 'object') {
                    if (expect.verb === actualVerb &&
                            expect.path === actualPath) {
                        subflow = curr.execute;
                        break;
                    }
                }
            }
            if (subflow)
                break;
        }

        if (subflow) {
            logger.info('[switch] Operation matched. Executing the subflow');
            context.flow.invoke({ execute: subflow}, resume);
        }
        else {
            logger.info('[switch] No operation matched. Skip the policy');
            next();
        }
    };
};
