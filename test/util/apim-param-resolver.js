var util = require('util');

module.exports = function(context, name, value) {
  if (util.isString(value))
    return value.replace(/\$\(([^)]+)\)/gm, function(m, g1) {
        return context.get(g1);
    });
  else
    return value;
}
