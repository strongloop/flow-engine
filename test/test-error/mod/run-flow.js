// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {
  return function(props, context, flow) {
    var logger = flow.logger;
    logger.debug('[run-flow] invoke a subflow (name: %s)', props.name);

    flow.invoke(props.theFlow, function() {
      logger.debug('[run-flow] done');

      var body = context.get('Body') || '';
      var v = body + '|' + props.name + '(resumed)';
      context.set('Body', v);

      flow.proceed();
    });
  };
};

