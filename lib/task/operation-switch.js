// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var logger = flow.logger;

    function resume() {
      logger.debug('[switch] Subflow is complete');
      flow.proceed();
    }

    var actualOpId = context.get('api.operationId') || '';
    var actualVerb = context.get('request.verb') || '';
    var actualPath = context.get('request.path') || '';
    logger.debug('[switch] Matching %s %s (%s)',
        actualVerb, actualPath, actualOpId);

    var subflow;
    for (var c in props.case) {
      var curr = props.case[c];
      for (var idx in curr.operations) {
        var expect = curr.operations[idx];
        if (typeof expect === 'string') {
          if (expect === actualOpId) {
            subflow = curr.execute;
            break;
          }
        } else if (typeof expect === 'object') {
          var verb = expect.verb || '';
          if (verb.toLowerCase() === actualVerb.toLowerCase() &&
              expect.path === actualPath) {
            subflow = curr.execute;
            break;
          }
        }
      }
      if (subflow) {
        break;
      }
    }

    if (subflow) {
      logger.debug('[switch] Operation matched. Executing the subflow');
      flow.invoke({ execute: subflow }, resume);
    } else {
      logger.debug('[switch] No operation matched. Skip the policy');
      flow.proceed();
    }
  };
};
