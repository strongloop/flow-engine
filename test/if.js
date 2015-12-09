var startGateway = require("./util/start-gateway.js");

describe("if-task_to-test-verb", function() {
  var request;

  before(
    startGateway(
      //optioins
      { flow: "test/assembly-flow/flow-if-verb.yaml",
        paramResolver: "util/apim-param-resolver.js",
        baseDir: __dirname },
      //done
      function(req) {
        request = req;
      }
    ));

  it("a POST request", function(done) {
    request.post("/dummy").expect(200, /POST response/, done);
  });

  it("a GET request", function(done) {
    request.get("/dummy").expect(200, /GET response/, done);
  });

  it("a DELETE request", function(done) {
    request.delete("/dummy").expect(200, /unknown/, done);
  });

  //a head response doesn"t have the body
  it("a HEAD request", function(done) {
    request.head("/dummy").expect(200, /$^/, done);
  });

});
