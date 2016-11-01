// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var subflow = props.subFlow;
    var logger = flow.logger;
    logger.debug('execute addSubFlow task');
    logger.debug('addSubFlow:', JSON.stringify(subflow));

    flow.invoke({ execute: subflow.execute }, function() {
      logger.debug('addSubFlow finished');
      flow.proceed();
    });
  };
};
