"use strict";
const ctx = require('../../context');

module.exports = function ( config ) {
    var ns = ctx.getCurrent();
    var logger = ns.get('logger');
    logger.info('params:', JSON.stringify(config));
    
    return function ( req, resp, next ) {
        logger.info('execute activity-log task');
        next();
    };
}
