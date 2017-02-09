// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {
  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('[run-flow] invoke a subflow (name: %s)', props.name);

    flow.invoke(props.theFlow, function() {
      logger.debug('[run-flow] done');

      var body = context.get('Body') || '';
      var v = body + '|' + props.name + '(resumed)';
      context.set('Body', v);

      flow.proceed();
    });
  };
};

