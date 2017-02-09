// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {
  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('ENTER bad policy');
    logger.debug('call next first time');
    flow.fail({ name: 'next1', message: 'foo' });
    logger.debug('call next second time');
    flow.fail({ name: 'next2', message: 'foo' });
    setTimeout(function() {
      logger.debug('call next third time');
      flow.fail({ name: 'next3', message: 'foo' });
    }, 0);
  };
};
