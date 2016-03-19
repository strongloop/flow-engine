// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function (config) {
    var rev = function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER no-param-resolving policy');

        context.set(props.name, props.value);
        flow.proceed();
    };

    rev.skipParamResolving = true;
    return rev;
};
