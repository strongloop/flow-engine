var startGateway = require('./util/start-gateway.js');

describe('error-handlers', function() {
  var request;

  before(
    startGateway(
      //options
      { flow: 'test/assembly-flow/flow-error-handler.yaml',
        paramResolver: 'util/apim-param-resolver.js',
        baseDir: __dirname },
      //done
      function(req) {
        request = req;
      }
    ));

  it('no error', function(done) {
    request.post('/dummy')
           .expect(200, /OK/, done);
  });

  it('recoverable error', function(done) {
    request.post('/dummy')
           .set('X-FOO-HDR', '50')
           .expect(200, /The minor error is recovered./, done);
  });

  it('major error', function(done) {
    request.delete('/dummy')
           .set('X-FOO-HDR', '300')
           .expect(500, /Found a major error./, done);
  });

  it('critical error', function(done) {
    request.get('/dummy')
           .set('X-FOO-HDR', '800')
           .expect(500, /Found a critical error./, done);
  });

});
