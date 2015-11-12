"use strict";

module.exports = function ( config ) {
    var url = require('url');
    var options = url.parse(config['target-url']);
    if (config.username && config.password)
        options.auth = config.username + ':' + config.password;
    options.timeout = (config.timeout ? config.timeout : 2 * 60) * 1000; // in milliseconds

    return function ( req, resp, next ) {
        var m = options.protocol.exec(/^http(s?):?/);
        if (m) {
            options.method = config.verb ? config.verb : req.method;
            var httpm;
            if (m[1]) {
              httpm = require('https');
            } else {
              httpm = require('http');
            }
            var treq = httpm.request(options, function(tresp) {
                resp.writeHead(tresp.statusCode, tresp.statusMessage, tresp.headers);
                tresp.on('data', function(chunk) {
                  resp.write(chunk);
                });
                tresp.on('end', function() {
                  resp.end();
                  next();
                });
            });
            treq.setTimeout(options.timeout, function() {
                next(new Error('timeout'));
            });
            if (options.method.match(/^(POST|PUT)$/) {
                if (req.body) {
                    treq.write(req.body);
                    treq.end();
                } else {
                    req.on('data', function(chunk) {
                        treq.write(chunk);
                    });
                    req.on('end', function() {
                        treq.end();
                    });
                }
            } else {
                // if not http(s), return with error
                next(new Error('Only http(s) protocol supported.'));
            }
        }
    }
}
