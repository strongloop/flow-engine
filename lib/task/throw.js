// © Copyright IBM Corporation 2015,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';

module.exports = function(config) {
  //the throw task simply calls next() with an object with error information
  return function(props, context, flow) {
    var error = {
      name: (props.name ? props.name + '' : 'ThrowError'),
      message: (props.message ? props.message + '' : undefined),
    };

    var logger = flow.logger;
    logger.error('[throw] throwing %j', error);
    flow.fail(error);
  };
};
