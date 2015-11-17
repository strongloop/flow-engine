'use strict';

module.exports = function (config) {
    //
    // APIm's specific parameter resolver callback
    //
    return function(context, name, value) {
        // let apimCtx = cls.getNamespace('apim');
        let apimCtx = require('../index').Context.getCurrent();
     
        return value.replace(/\$\(([^)]+)\)/gm, function(m, g1) {
            return apimCtx.get(g1);
        });
     };
}