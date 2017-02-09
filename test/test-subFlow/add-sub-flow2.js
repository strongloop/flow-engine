// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var subflow = props.subFlow;
    var logger = flow.logger;
    logger.debug('execute addSubFlow task');
    logger.debug('addSubFlow:', JSON.stringify(subflow));

    flow.invoke({ execute: subflow.execute }, function() {
      logger.debug('addSubFlow finished');
      flow.proceed();
    });
  };
};
