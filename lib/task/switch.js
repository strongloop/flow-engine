// © Copyright IBM Corporation 2016,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';
var sandbox = require('../sandbox');

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;

    function resume() {
      logger.debug('[switch] resume now');
      flow.proceed();
    }

    for (var idx in props.case) {
      var curr = props.case[idx];
      if (curr.condition) {
        //evaluate the condition
        var text = curr.condition;
        logger.debug('[switch] evaluating the "%s"', text);

        var result;
        try {
          result = sandbox.runInContext(text, context);
        } catch (e) {
          logger.error('[switch] evaluation error (%s): %s', text, e);
          var error = {
            name: 'RuntimeError',
            message: e.toString(),
          };

          flow.fail(error);
          return;
        }

        //if the condition is true, execute the subflow
        if (result) {
          logger.info('[switch] condition holds (%s)', text);

          flow.invoke({ execute: curr.execute }, resume);
          return;
        }
      } else if (curr.otherwise) {
        logger.info('[switch] go to the otherwise case.');

        flow.invoke({ execute: curr.otherwise }, resume);
        return;
      }
    }
    logger.info('[switch] no case is matched. Moving on...');

    flow.proceed();
  };
};
