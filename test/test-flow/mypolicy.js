// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {
  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('ENTER mypolicy policy');

    context.set(props.name, props.value);
    if (props.stop === true) {
      flow.stop();
    } else {
      flow.proceed();
    }
  };
};
