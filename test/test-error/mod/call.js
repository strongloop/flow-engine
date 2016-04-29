//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';

module.exports = function (config) {

  return function (props, context, flow) {
    var subflow = { 'execute': props.execute };
    var logger = flow.logger;
    logger.debug('[call] calling "%s" now', props.name);

    flow.invoke(subflow, function() {
      logger.debug('[call] "%s" completed', props.name);
      flow.proceed();
    });
  };
};

