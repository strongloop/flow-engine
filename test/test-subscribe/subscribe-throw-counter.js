//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';

module.exports = function (config) {

  return function (props, context, flow) {
    var logger = flow.logger;
    logger.debug('execute subscribe-throw task');

    var eh = function(event, next) {
      var count = getCount(context.get('verify-me'));
      context.set('verify-me', 'ev-throw-' + (count+1));
      throw new Error('throw error');
    };
    var events = props.event.split(',');
    events.forEach(function (event) {
      flow.subscribe(event, eh);
    });
    flow.proceed();
  };
};

function getCount(value) {
  if ( value === undefined ) {
    return 0;
  } else if (value.indexOf('ev-throw') === 0) {
    var re = /ev-throw-(\d)/;
    var match = re.exec(value);
    return parseInt(match[1]);
  }
  return 0;
}