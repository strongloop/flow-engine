// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

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
