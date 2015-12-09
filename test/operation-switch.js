var startGateway = require("./util/start-gateway.js");

describe("switch-on-operations", function() {
  var request;

  before(
    startGateway(
      //options
      { flow: "test/assembly-flow/flow-operation-switch.yaml",
        paramResolver: "util/apim-param-resolver.js",
        baseDir: __dirname },
      //done
      function(req) {
        request = req;
      }
    ));

  it("create an order", function(done) {
    request.post("/order")
           .set("X-OP-TYPE", "createOrder")
           .expect(200, /A new order is created./, done);
  });

  it("update an order", function(done) {
    request.post("/order")
           .set("X-OP-TYPE", "updateOrder")
           .expect(200, /The given order is updated./, done);
  });

  it("delete an order", function(done) {
    request.delete("/order")
           .set("X-OP-TYPE", "deleteOrder")
           .expect(500, /Deleting orders is not allowed./, done);
  });

  //this operation is not handled in flow
  it("read an order", function(done) {
    request.get("/order")
           .set("X-OP-TYPE", "getOrder")
           .expect(404, /Cannot GET \/order/, done);
  });

});
