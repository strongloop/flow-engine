// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';
var sandbox = require('../sandbox');

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;

    function resume() {
      logger.debug('[if] resume now.');
      flow.proceed();
    }

    var text = props.condition;
    logger.debug('[if] evaluating the condition: %s', text);

    var result;
    try {
      result = sandbox.runInContext(text, context);
    } catch (e) {
      logger.error('[if] failed to evaluate the condition: %s', e);

      var error = {
        name: 'RuntimeError',
        message: e.toString(),
      };
      flow.fail(error);
      return;
    }

    // evaluate the condition and execute tasks
    if (result) {
      logger.debug('[if] invoke the subflow: %j', props.execute);

      flow.invoke({
        execute: props.execute,
      }, resume);
    } else {
      logger.debug('[if] skip the subflow: %j', props.execute);

      flow.proceed();
    }
  };
};
