// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var subflow = { execute: props.execute };
    var logger = flow.logger;
    logger.debug('[call] calling "%s" now', props.name);

    flow.invoke(subflow, function() {
      logger.debug('[call] "%s" completed', props.name);
      flow.proceed();
    });
  };
};

