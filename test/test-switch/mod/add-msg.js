// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;

    var value = props.value;

    if (!context.message) {
      context.message = {};
    }

    if (!context.message.body) {
      context.message.body = {};
    }

    if (!context.message.statusCode) {
      context.message.statusCode = 200;
    }

    for (var key in value) {
      logger.info('%s %s', key, value[key]);
      context.message.body[key] = value[key];
    }

    logger.info('[add-msg] body becomes %j', context.message.body);
    flow.proceed();
  };
};
