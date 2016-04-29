//Copyright IBM Corp. 2015,2016. All Rights Reserved.
//Node module: flow-engine
//US Government Users Restricted Rights - Use, duplication or disclosure
//restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
var express   = require('express');
var supertest = require('supertest');
var yaml      = require('yamljs');
var createFlow = require('../../index.js');
var createContext = require('../../index.js').createContext;

require('events').EventEmitter.prototype._maxListeners = 100;


module.exports = function() {
  if (arguments.length < 2) {
    throw new Error(
        'Need at least 2 parameters to start Gateway.\n' +
        'Usage: startGateway(flow-options [, backend-options], done)');
  }

  var flowOptions = arguments[0];
  var backendOptions;
  var done;
  if (arguments.length === 2) {
    backendOptions = null;
    done = arguments[1];
  }
  else {
    backendOptions = arguments[1];
    done = arguments[2];
  }

  return function(next, middlewares) {
    var backendPort;

    function startGateway() {
      function flowMiddleware(request, response, next) {
        flowOptions.context = request.context;
        createFlow(flowOptions)(request, response, next);
      }

      var callbacks = [flowMiddleware];
      var config = yaml.load(flowOptions.flow);
      callbacks.unshift(function(request, response, next) {
        var context = createContext();
        context.set('target-host', 'localhost:' + backendPort);
        function _eval(m, g) {
          /*jshint evil:true */
          return eval(g);
        }
        if (config.context) {
          for (var key in config.context) {
            if (config.context.hasOwnProperty(key)) {
              var value = config.context[key];
              if (typeof value === 'string') {
                value = value.replace(/\$\{([^}]+)\}/, _eval);
              }
              context.set(key, value);
            }
          }
        }
        request.context = context;
        next();
      });

      if ( middlewares && middlewares instanceof Array ) {
        middlewares.forEach(function(one) {
          callbacks.push(one);
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
    }
    else {
      startGateway();
    }
  };
};
