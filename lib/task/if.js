"use strict";

module.exports = function (config) {

    return function (req, resp, next, invoke) {
        console.info("[if] evaluate the condition: " + config.condition);
        console.info("[if] invoke the subflow: " + config.execute);

        function resume() {
            console.error("[if] resume the work with: " + arguments[0]);
            next();
        };

        invoke(config.execute, resume);
    };
}
