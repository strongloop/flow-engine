'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var label = props.label;
        var code = props.code;
        var logger = flow.logger;
        logger.info('[append-code] label=%s code=%s', label, code);

        var origin = context.get(label);
        code = (origin ? origin : '') + '|' + code;
        context.set(label, code);
        flow.proceed();
    };
};
