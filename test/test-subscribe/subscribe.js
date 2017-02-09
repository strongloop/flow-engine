// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('execute subscribe task');

    var eh = function(event, next) {
      if (props['next-error']) {
        context.set('verify-me', 'ev-error');
        next(new Error('from subscribe-finish'));
      } else {
        context.set('verify-me', 'ev-ok');
        next();
      }
    };

    var events = props.event.split(',');
    events.forEach(function(event) {
      flow.subscribe(event, eh);
    });
    flow.proceed();
  };
};
