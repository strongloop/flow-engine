'use strict';

const assert = require('assert');

module.exports = function (config) {
    return function (props, context, flow) {
        var logger = flow.logger;
        logger.info('ENTER set-code policy');
        assert(props.value === 'next1');
        flow.proceed();
    };
};
