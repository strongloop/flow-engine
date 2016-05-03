//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    if (!context.message) {
      context.message = {};
    }

    context.message.statusCode = 200;
    context.message.body =
      context.error.name + ': ' + context.error.message;
    context.message.headers = {};

    flow.proceed();
  };
};
