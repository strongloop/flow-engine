'use strict';

module.exports = function (config) {
    let parameter = config.parameter;
    return function(req, resp, next) {
        resp.myLog = resp.myLog || [];
        resp.myLog.push(parameter);
        next();
    };
};
