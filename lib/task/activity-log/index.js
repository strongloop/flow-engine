"use strict";
const ctx = require('../../context');

module.exports = function ( config ) {
    
    return function ( req, resp, next ) {
        var ns = req.ctx;
        var logger = ns.get('logger');
        logger.info('params:', JSON.stringify(config));

        logger.info('execute activity-log task');
        next();
    };
}
