'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var label = props.label;
        var code = props.code;
        var logger = context.get('logger');
        logger.info('[append-code] label=%s code=%s', label, code);

        var origin = context.get(label);
        code = (origin ? origin : '') + '|' + code;
        context.set(label, code);
        next();
    };
};
