// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

'use strict';

module.exports = function(config) {
  var rev = function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('ENTER no-param-resolving policy');

    context.set(props.name, props.value);
    flow.proceed();
  };

  rev.skipParamResolving = true;
  return rev;
};
