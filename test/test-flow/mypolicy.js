// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {
  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('ENTER mypolicy policy');

    context.set(props.name, props.value);
    if (props.stop === true) {
      flow.stop();
    } else {
      flow.proceed();
    }
  };
};
