var startGateway = require('./util/start-gateway.js');

describe('invoke', function() {
  var request;
  before(
    startGateway(
      { flow: 'test/assembly-flow/flow-invoke.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname},
      { callback: function(req, res) { // backend service
          res.write(req.method + ' ' + req.path);
          res.end();
        },
      },
      function(req) {   // done
        request = req;
      }
    ));

  it('reverse proxy - POST ', function(done) {
    request.post('/foo/bar').expect(200, /^POST \/bar$/, done);
  });

  it('reverse proxy - GET', function(done) {
    request.get('/foo/bar').expect(200, /^GET \/bar$/, done);
  });

});

describe('invoke-timeout', function() {
  var request;
  before(
    startGateway(
      { flow: 'test/assembly-flow/flow-invoke-timeout.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname},
      { callback: function(req, res) { // backend service
          setTimeout(function() {
            res.write(req.method + ' ' + req.path);
            res.end();
          }, 1200);
        },
      },
      function(req) {   // done
        request = req;
      }
    ));

  it('timeout', function(done) {
    request.post('/foo/timeout').expect(500, done);
  });

});

describe('invoke-basic-auth', function() {
  var auth = require('http-auth');

  var request;
  var username = 'admin';
  var password = 'f00lpr00f';
  var basic = auth.basic({
      realm: 'SUPER SECRET STUFF'
  }, function(name, pwd, callback) {
      callback(name === username && pwd === password);
  });

  before(
    startGateway(
      { flow: 'test/assembly-flow/flow-invoke-auth.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname},
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
    request.post('/foo/secret').expect(200, /basic auth works/, done);
  });

});
