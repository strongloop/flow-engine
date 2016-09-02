// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    if (!context.message) {
      context.message = {};
    }

    context.message.statusCode = 200;
    context.message.body =
      context.error.name + ': ' + context.error.message;
    context.message.headers = {};

    flow.proceed();
  };
};
