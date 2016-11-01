// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

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
