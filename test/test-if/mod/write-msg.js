'use strict';

module.exports = function (config) {

    return function (props, context, next) {
        var logger = context.get('logger');

        var statusCode = props.statusCode;
        var statusMsg = props.statusMsg;
        var body = props.body;
        var headers = props.headers;

        if (!context.message)
            context.message = {};

        if (statusCode)
            context.message.statusCode = statusCode;
        if (statusMsg)
            context.message.statusMessage = statusMsg;
        if (body)
            context.message.body = body;
        if (headers)
            context.message.headers = headers;

        //got Code without Msg, then we'll give a default value
        if (!statusMsg && statusCode) {
            context.message.statusMessage =
                (statusCode === 200 ? 'OK' : 'No Reason');
        }

        logger.info('[write-msg] code=%d body=%s', statusCode, body);
        next();
    };
};
