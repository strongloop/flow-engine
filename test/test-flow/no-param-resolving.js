// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


'use strict';

module.exports = function(config) {
  var rev = function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('ENTER no-param-resolving policy');

    context.set(props.name, props.value);
    flow.proceed();
  };

  rev.skipParamResolving = true;
  return rev;
};
