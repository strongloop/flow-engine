'use strict';
var url = require('url');

// TODO: handle self signed certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

//TODO: deal with the 'hostNotFound' error

module.exports = function (config) {

    return function (props, context, next) {
        var options = url.parse(props['target-url']);
        var req = context.req;
        var resp = context.res;

        //the authentication
        if (props.username && props.password)
            options.auth = props.username + ':' + props.password;
        //in milliseconds, default to 2 minutes
        options.timeout = (props.timeout ? props.timeout : 2 * 60) * 1000;
        //the method
        options.method = props.verb ? props.verb : req.method;

        var m = options.protocol.match(/^http(s?):?/);
        if (m) {
            var httpm;
            if (m[1])
              httpm = require('https');
            else
              httpm = require('http');

            var treq = httpm.request(options, function(tresp) {
                if (tresp.statusCode === 200) {
                    //copy the invoke result to the flow response
                    resp.writeHead(tresp.statusCode,
                                   tresp.statusMessage,
                                   tresp.headers);

                    tresp.on('data', function(chunk) {
                      resp.write(chunk);
                    });

                    tresp.on('end', function() {
                      resp.end();
                      next();
                    });
                }
                else {
                    //TODO: a non-200 response should not be treated as error
                    var error = {
                        'name': 'invoke error',
                        'value': tresp.statusCode,
                        'message': tresp.statusMessage
                    };
                    next(error);
                }
            });

            treq.on('error', function(err) {
                next(err);
            });

            treq.setTimeout(options.timeout, function() {
                var error = {
                    'name': 'connection error',
                    'value': 'timeout'
                };
                next(error);
            });

            if (options.method.match(/^(POST|PUT)$/)) {
                if (req.body) {
                    if ( Buffer.isBuffer(req.body) ||
                         (typeof req.body === 'string') ) {
                        treq.write(req.body);
                    } else if (typeof req.body === 'object') {
                        treq.write(JSON.stringify(req.body));
                    } else {
                        treq.write(''+req.body);
                    }
                    treq.end();
                }
                else {
                    req.on('data', function(chunk) {
                        treq.write(chunk);
                    });
                    req.on('end', function() {
                        treq.end();
                    });
                }
            }
            else {
                //TODO: ?
                treq.end();
            }
        }
        else {
            // if not http(s), return with error
            var error = {
                'name': 'property error',
                'value': 'unsupported protocol',
                'message': 'Only the HTTP(s) protocol is supported.'
            };
            next(error);
        }
    };
};
