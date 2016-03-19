// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER mypolicy policy');

        context.set(props.name, props.value);
        if (props.stop === true) {
            flow.stop();
        } else {
            flow.proceed();
        }
    };
};
