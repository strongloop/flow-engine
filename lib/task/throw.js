"use strict";
const context = require('../context');

module.exports = function (config) {
    var ns      = context.getCurrent();
    var logger  = ns.get('logger');

    //the throw task simply calls next() with config.value as the error
    return function (req, resp, next) {
        logger.error("[throw] raise the error '" + config.value +"'");
        next(config.value);
    };
}
