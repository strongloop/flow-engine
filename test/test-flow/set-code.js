//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';

var assert = require('assert');

module.exports = function (config) {
  return function (props, context, flow) {
    var logger = flow.logger;
    logger.debug('ENTER set-code policy');
    assert(props.value === 'next1');
    flow.proceed();
  };
};
