// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(/*config*/) {

  return function(props, context, flow) {
    var logger = flow.logger;
    if (logger.debug()) {
      logger.debug('params:', JSON.stringify(props));
      logger.debug('execute activity-log task');
    }
    flow.proceed();
  };
};
