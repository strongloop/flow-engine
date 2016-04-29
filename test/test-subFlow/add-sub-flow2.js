//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function (config) {

  return function (props, context, flow) {
    var subflow = props.subFlow;
    var logger = flow.logger;
    logger.debug('execute addSubFlow task');
    logger.debug('addSubFlow:', JSON.stringify(subflow));

    flow.invoke({ execute:subflow.execute}, function() {
      logger.debug('addSubFlow finished');
      flow.proceed();
    });
  };
};
