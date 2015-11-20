var fe = require('../../index.js');

module.exports = function(flowCfg, options) {
  return function(req, resp, next) {
    var f = fe.Flow(flowCfg, options);
    f.prepare(req, resp, next);
    f.run();
  }
}
