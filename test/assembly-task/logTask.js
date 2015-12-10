'use strict';

module.exports = function (config) {
    let parameter = config.parameter;
    return function(ctx, next) {
        var resp = ctx.res;
        resp.myLog = resp.myLog || [];
        resp.myLog.push(parameter);
        next();
    };
};
