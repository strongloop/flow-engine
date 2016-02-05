'use strict';

module.exports = function (config) {
    return function(props, ctx, next) {
        let parameter = props.parameter;
        var resp = ctx.res;
        resp.myLog = resp.myLog || [];
        resp.myLog.push(parameter);
        next();
    };
};
