"use strict";

module.exports = function ( config ) {
    var code = config.code;
    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('execute set-response-code task');
        logger.debug('code:', code);
        context.set('set-secret-code', code);
        next();
    };
}