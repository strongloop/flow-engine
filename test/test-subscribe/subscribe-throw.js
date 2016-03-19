// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function (config) {

    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('execute subscribe-throw task');

        var eh = function(event, next) {
            context.set('verify-me', 'ev-throw');
            throw new Error('throw error');
        };
        var events = props.event.split(',');
        events.forEach(function (event) {
            flow.subscribe(event, eh);
        });
        flow.proceed();
    };
};