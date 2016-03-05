module.exports = function() {
  return function(context, name, value) {
    if (typeof value === 'string')
      return value.replace(/\$\(([^)]+)\)/gm, function(m, g1) {
          return context.get(g1);
      });
    else
      return value;
  };
};
