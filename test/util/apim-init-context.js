module.exports = function(setup) {
  return function(req, resp, next) {
    var contextFactory = require('../../index').Context;
    var apimCtx = contextFactory.getCurrent();
    if (!apimCtx) {
       apimCtx = contextFactory.create();
       apimCtx.bindEmitter(req);
       apimCtx.bindEmitter(resp);
    }
    apimCtx.run(function() {
      setup(req, resp, next, apimCtx)
    });
  }

}
