// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var label = props.label;
    var code = props.code;
    var logger = flow.logger;
    logger.debug('[append-code] label=%s code=%s', label, code);

    var origin = context.get(label) || '';
    code = origin + '|' + code;
    context.set(label, code);
    flow.proceed();
  };
};
