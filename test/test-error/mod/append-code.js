//Copyright IBM Corp. 2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function (config) {

  return function (props, context, flow) {
    var label = props.label;
    var code = props.code;
    var logger = flow.logger;
    logger.debug('[append-code] label=%s code=%s', label, code);

    var origin = context.get(label);
    code = (origin ? origin : '') + '|' + code;
    context.set(label, code);
    flow.proceed();
  };
};
