//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';

module.exports = function (config) {

  return function (props, context, flow) {
    var code = props.code;
    var logger = flow.logger;
    logger.debug('execute set-response-code task');
    logger.debug('code:', code);

    context.set('set-secret-code', code);
    flow.proceed();
  };
};
