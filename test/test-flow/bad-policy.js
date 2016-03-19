// Copyright IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

'use strict';

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER bad policy');
        logger.debug('call next first time');
        flow.fail({'name': 'next1', 'message':'foo'});
        logger.debug('call next second time');
        flow.fail({'name': 'next2', 'message':'foo'});
        setTimeout(function() {
            logger.debug('call next third time');
            flow.fail({'name': 'next3', 'message':'foo'});
        }, 0);
    };
};
