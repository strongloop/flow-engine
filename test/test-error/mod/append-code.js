'use strict';

module.exports = function (config) {
    var label = config.label;
    var code = config.code;

    return function (context, next) {
        var logger = context.get('logger');
        logger.info('[append-code] label=%s code=%s', label, code);

        var origin = context.get(label);
        code = (origin ? origin : '') + '|' + code;
        context.set(label, code);
        next();
    };
};
