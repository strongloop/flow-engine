'use strict';

var assert = require('assert');

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.debug('ENTER set-code policy');
        assert(props.value === 'next1');
        flow.proceed();
    };
};
