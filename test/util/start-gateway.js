var util = require('util');
var express   = require('express');
var supertest = require('supertest');
var yaml      = require('yamljs');
var createFlow = require('../../index.js');


module.exports = function() {
  if (arguments.length < 2) {
    throw new Error('Need at least 2 parameters to start Gateway, usage: startGateway(flow-options [, backend-options], done)')
  }
  var flowOptions = arguments[0];
  if (arguments.length === 2) {
    var backendOptions = null;
    var done = arguments[1];
  } else {
    var backendOptions = arguments[1];
    var done = arguments[2];
  }

  return function(next) {
    var backendPort;
    function startGateway() {
      var flow = createFlow(flowOptions);
      var callbacks = [flow];
      var config = yaml.load(flowOptions.flow)
      if (config.context) {
        callbacks.unshift(function(request, response, next) {
          var createContext = require('../../index').createContext;
          var apimCtx = createContext('apim');
          apimCtx.set('target-host', 'localhost:' + backendPort)
          for (var key in config.context) {
            if (config.context.hasOwnProperty(key)) {
              var value = config.context[key];
              if (util.isString(value)) {
                value = value.replace(/\$\{([^}]+)\}/, function(m, g) {
                  return eval(g);
                });
              }
              apimCtx.set(key, value);
            }
          }
          request.ctx = apimCtx
          request.ctxNS = 'apim';
          next();
        });
      }
      var gatewayApp = express();
      gatewayApp.all('/*', callbacks);
      gatewayApp.listen(0, function() {
        var gatewayPort = this.address().port;
        done(supertest('http://localhost:' + gatewayPort));
        next();
      });
    }

    if (backendOptions) {
        var backendApp = express();
        var callbacks = [backendOptions.callback];
        if (backendOptions.middleware) {
          callbacks.unshift(backendOptions.middleware);
        }
        backendApp.all('/*', callbacks);
        backendApp.listen(0, function() {
          backendPort = this.address().port;
          startGateway();
        });
    } else {
      startGateway();
    }
  }
}
