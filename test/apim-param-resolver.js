'use strict';

module.exports = function (config) {
    //
    // APIm's specific parameter resolver callback
    //
    return function(context, name, value) {
  
        return value.replace(/\$\(([^)]+)\)/gm, function(m, g1) {
            return context.get(g1);
        });
     };
}