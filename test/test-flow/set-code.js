'use strict';

const assert = require('assert');

module.exports = function (config) {
    return function (props, context, next) {
        var logger = context.get('logger');
        logger.info('ENTER set-code policy');
        assert(props.value === 'next1');
        next();
    };
};
