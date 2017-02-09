// © Copyright IBM Corporation 2015,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
module.exports = function() {
  return function(context, name, value) {
    if (typeof value === 'string') {
      return value.replace(/\$\(([^)]+)\)/gm, function(m, g1) {
        return context.get(g1);
      });
    } else {
      return value;
    }
  };
};
