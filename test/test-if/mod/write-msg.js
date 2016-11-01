// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;

    var statusCode = props.statusCode;
    var statusMsg = props.statusMsg;
    var body = props.body;
    var headers = props.headers;

    if (!context.message) {
      context.message = {};
    }

    if (statusCode) {
      context.message.statusCode = statusCode;
    }

    if (statusMsg) {
      context.message.statusMessage = statusMsg;
    }

    if (body) {
      context.message.body = body;
    }

    if (headers) {
      context.message.headers = headers;
    }

    //got Code without Msg, then we'll give a default value
    if (!statusMsg && statusCode) {
      context.message.statusMessage =
        (statusCode === 200 ? 'OK' : 'No Reason');
    }

    logger.debug('[write-msg] code=%d body=%s', statusCode, body);
    flow.proceed();
  };
};
