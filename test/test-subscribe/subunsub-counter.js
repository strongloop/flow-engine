// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('execute subunsub task');
    var count;
    var eh = function(event, next) {
      if (props['next-error']) {
        count = getCount(context.get('verify-me'));
        context.set('verify-me', 'ev-error-' + (count + 1));
        next(new Error('from subscribe-finish-counter'));
      } else {
        count = getCount(context.get('verify-me'));
        context.set('verify-me', 'ev-ok-' + (count + 1));
        next();
      }
    };
    var subevents = props['sub-event'].split(',');
    subevents.forEach(function(event) {
      flow.subscribe(event, eh);
    });
    var unsubevents = props['unsub-event'].split(',');
    unsubevents.forEach(function(event) {
      flow.unsubscribe(event, eh);
    });
    flow.proceed();
  };
};

function getCount(value) {
  var re, match;
  if (value === undefined) {
    return 0;
  } else if (value.indexOf('ev-error') === 0) {
    re = /ev-error-(\d)/;
    match = re.exec(value);
    return parseInt(match[1], 10);
  } else if (value.indexOf('ev-ok') === 0) {
    re = /ev-ok-(\d)/;
    match = re.exec(value);
    return parseInt(match[1], 10);
  }
  return 0;
}
