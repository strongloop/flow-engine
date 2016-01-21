'use strict';

module.exports = function ( config ) {
    var subflow = { 'execute': config.execute };

    return function ( context, next ) {
        var logger = context.get('logger');
        logger.info('[call] calling "%s" now', config.name);

        context.flow.invoke(subflow, function() {
            logger.info('[call] "%s" completed', config.name);
            next();
        });
    };
};

