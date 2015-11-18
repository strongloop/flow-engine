"use strict";
const context = require('../context');

module.exports = function (config) {

    //the throw task simply calls next() with config.value as the error
    return function (req, resp, next) {
        var ns      = req.ctx;
        var logger  = ns.get('logger');
        logger.error("[throw] raise the error '" + config.value +"'");
        next(config.value);
    };
}
