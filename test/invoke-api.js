var express = require('express');
var supertest = require('supertest');
var auth = require('http-auth');

var username = "admin";
var password = "f00lpr00f";

var basic = auth.basic({
    realm: 'SUPER SECRET STUFF'
}, function(name, pwd, callback) {
    callback(name == username && pwd == password);
});

describe('invoke-api task', function() {

  var backendPort, gatewayPort, request;
  before(startBackendService);
  before(startGateway);

  it('reverse proxy', function(done) {
    request.post("/foo/bar").expect(200, /^POST \/bar$/, done);
  });

  it('timeout in 1 second', function(done) {
    request.post("/foo/timeout").expect(500, done);
  });

  it('basic authentication', function(done) {
    request.post("/foo/secret").expect(200, /basic auth works/, done);
  });

  function startBackendService(done) {
    var app = express();
    var authMiddleware = auth.connect(basic);

    app.post('/bar', function(req, res) {
      res.write(req.method + " " + req.path);
      res.end();
    });
    app.post('/timeout', function(req, res) {
      setTimeout(function() {
        res.write(req.method + " " + req.path);
        res.end();
      }, 1200);
    });
    app.post('/secret', authMiddleware, function(req, res) {
      res.send('basic auth works');
    });

    app.listen(0, function() {
      backendPort = this.address().port;
      console.error('backendPort: ' + backendPort);
      done();
    });
  }

  var initContext = require('./util/apim-init-context.js');
  var createFlow = require('./util/create-flow.js');
  var apimParamResolver = require('./util/apim-param-resolver.js');
  function startGateway(done) {
    var app = express();
    var initCtxMiddleware = initContext(function(req, res, next, ctx) {
      ctx.set("request.verb", req.method);
      ctx.set("request.path", req.path.replace('/foo/', ''));
      ctx.set("target-host", "localhost:" + backendPort);
      next();
    });
    var flow1 = createFlow(
      {
        "execute": [
          {
            "invoke-api": {
              "target-url": "http://$(target-host)/$(request.path)",
              "verb": "$(request.verb)",
              "timeout": 1
            }
          }
        ]
      }, {paramResolver: apimParamResolver});
      var flow2 = createFlow(
        {
          "execute": [
            {
              "invoke-api": {
                "target-url": "http://$(target-host)/$(request.path)",
                "verb": "$(request.verb)",
                "timeout": 1,
                "username": username,
                "password": password
              }
            }
          ]
        }, {paramResolver: apimParamResolver});
    app.all('/foo/secret', [initCtxMiddleware, flow2]);
    app.all('/foo/*', [ initCtxMiddleware, flow1 ]);

    var server = app.listen(0, function() {
        gatewayPort = this.address().port;
        console.error('gatewayPort: ' + gatewayPort);
        request = supertest('http://localhost:' + gatewayPort);
        done();
    });
  }
});
