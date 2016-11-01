// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var subflow = { execute: props.execute };
    var logger = flow.logger;
    logger.debug('[call] calling "%s" now', props.name);

    flow.invoke(subflow, function() {
      logger.debug('[call] "%s" completed', props.name);
      flow.proceed();
    });
  };
};

