var startGateway = require('./util/start-gateway.js');

describe('invoke-api', function() {
  var request;
  before(
    startGateway(
      { flow: "test/flow-invoke-api.yaml", paramResolver: 'util/apim-param-resolver.js', baseDir: __dirname},
      { callback: function(req, res) { // backend service
          res.write(req.method + " " + req.path);
          res.end();
        },
      },
      function(req) {   // done
        request = req;
      }
    ));

  it('reverse proxy', function(done) {
    request.post("/foo/bar").expect(200, /^POST \/bar$/, done);
  });

});

describe('invoke-api-timeout', function() {
  var request;
  before(
    startGateway(
      { flow: "test/flow-invoke-api-timeout.yaml", paramResolver: 'util/apim-param-resolver.js', baseDir: __dirname},
      { callback: function(req, res) { // backend service
          setTimeout(function() {
            res.write(req.method + " " + req.path);
            res.end();
          }, 1200);
        },
      },
      function(req) {   // done
        request = req;
      }
    ));

  it('timeout', function(done) {
    request.post("/foo/timeout").expect(500, done);
  });

});

describe('invoke-api-basic-auth', function() {
  var auth = require('http-auth');

  var request;
  var username = "admin";
  var password = "f00lpr00f";
  var basic = auth.basic({
      realm: 'SUPER SECRET STUFF'
  }, function(name, pwd, callback) {
      callback(name == username && pwd == password);
  });

  before(
    startGateway(
      { flow: "test/flow-invoke-api-auth.yaml", paramResolver: 'util/apim-param-resolver.js', baseDir: __dirname},
      { callback: function(req, res) { // backend service
          res.send('basic auth works');
        },
        middleware: auth.connect(basic)
      },
      function(req) {   // done
        request = req;
      }
    ));

  it('basic authentication', function(done) {
    request.post("/foo/secret").expect(200, /basic auth works/, done);
  });

});
