//Copyright IBM Corp. 2015,2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

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
