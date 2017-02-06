// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var code = props.code;
    var logger = flow.logger;
    logger.debug('execute set-response-code task');
    logger.debug('code:', code);

    context.set('set-secret-code', code);
    flow.proceed();
  };
};
