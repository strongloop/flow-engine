// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node */
'use strict';

module.exports = function(config) {

  return function(props, context, flow) {
    var label = props.label;
    var code = props.code;
    var logger = flow.logger;
    logger.debug('[append-code] label=%s code=%s', label, code);

    var origin = context.get(label) || '';
    code = origin + '|' + code;
    context.set(label, code);
    flow.proceed();
  };
};
