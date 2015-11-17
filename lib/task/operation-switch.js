"use strict";
const context = require('../context');

module.exports = function (config) {
    var ns      = context.getCurrent();
    var logger  = ns.get('logger');

    return function (req, resp, next, invoke) {
        function resume() {
            logger.info("[switch] subflow is complete");
            next();
        };

        var target = ns.get("operation.id");
        var subflow = undefined;
        for (var c in config.case) {
            var curr = config.case[c];
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
            logger.info("[switch] a case is found matched for the operation '" + target + "'. Executing the subflow.");
            invoke(subflow, resume);
        }
        else {
            logger.warn("[switch] no switch case is matched for the operation '" + target + "'. Skipped.");
            next();
        }
    };
}
