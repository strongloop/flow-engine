// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


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
