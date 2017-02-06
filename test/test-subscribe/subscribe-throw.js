// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('execute subscribe-throw task');

    var eh = function(event, next) {
      context.set('verify-me', 'ev-throw');
      throw new Error('throw error');
    };
    var events = props.event.split(',');
    events.forEach(function(event) {
      flow.subscribe(event, eh);
    });
    flow.proceed();
  };
};
