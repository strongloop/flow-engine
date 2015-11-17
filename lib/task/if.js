"use strict";
const context = require('../context');

module.exports = function (config) {
    var ns      = context.getCurrent();
    var logger  = ns.get('logger');

    return function (req, resp, next, invoke) {
        logger.info("[if] evaluate the condition: " + config.condition);
        logger.info("[if] invoke the subflow: " + config.execute);

        function resume() {
            logger.info("[if] resume the work with: " + arguments[0]);
            next();
        };

        invoke(config.execute, resume);
    };
}
