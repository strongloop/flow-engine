// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';
var url = require('url');

function invoke(props, context, flow) {
  var logger = flow.logger;
  var _returned = false;
  function _next(e) {
    if (!_returned) {
      if (e) {
        flow.fail(e);
      } else {
        flow.proceed();
      }
      _returned = true;
    } else {
      logger.warn('[invoke] has already returned earlier.');
    }
  }

  //the default settings and error object
  var options;
  var isSecured;
  var verb;
  var useChunk = false;
  var timeout = 60;
  var compression = false;
  var error = {
    name: 'PropertyError',
  };
  var data;
  var dataSz = 0;

  if (!props || typeof props !== 'object') {
    error.message = 'Invalid property object';
    _next(error);
    return;
  }

  if (typeof props['target-url'] === 'string') {
    options = url.parse(props['target-url']);
  }

  //target-url
  if (!options || !options.hostname || !options.protocol ||
      (options.protocol !== 'http:' && options.protocol !== 'https:')) {
    error.message = 'Invalid target-url: "' + props['target-url'] + '"';
    _next(error);
    return;
  } else if (options.protocol === 'https:') {
    isSecured = true;
  }
  logger.debug('invoke options: %j', options);

  //verb: default to request.verb
  verb = props.verb ? String(props.verb).toUpperCase() : context.request.verb;
  if (verb !== 'POST' && verb !== 'GET' && verb !== 'PUT' &&
      verb !== 'DELETE' && verb !== 'OPTIONS' && verb !== 'HEAD' &&
      verb !== 'PATCH') {
    error.message = 'Invalid verb: "' + props.verb + '"';
    _next(error);
    return;
  } else {
    options.method = verb;
  }
  logger.debug('invoke verb: %s', verb);

  //http-version: 1.1
  if (props['http-version'] && props['http-version'] !== '1.1') {
    error.message = 'Invalid http-version: "' + props['http-version'] + '"';
    _next(error);
    return;
  }

  //chunked-upload
  if (props['chunked-upload'] && props['chunked-upload'] !== 'false') {
    useChunk = true;
  }
  logger.debug('invoke useChunk: %s', useChunk);

  //timeout: between 1 to 86400 seconds
  if (!isNaN(parseInt(props.timeout, 10))) {
    var tmp = parseInt(props.timeout, 10);
    if (tmp < 1) {
      timeout = 1;
    } else if (tmp > 86400) {
      timeout = 86400;
    } else {
      timeout = tmp;
    }
  }
  logger.debug('invoke timeout: %s', timeout);

  //compression
  if (props.compresssion && props.compresssion !== 'false') {
    compression = true;
  }
  logger.debug('invoke compression: %s', compression);

  //authentication
  if (props.username && props.password) {
    options.auth = props.username + ':' + props.password;
  }
  logger.debug('invoke auth: %s', options.auth);

  //TODO: get the TLS profile

  //copy headers
  options.headers = {};
  for (var i in context.message.headers) {
    options.headers[i] = context.message.headers[i];
  }
  delete options.headers['host'];
  delete options.headers['connection'];
  delete options.headers['content-length'];
  delete options.headers['transfer-encoding'];

  //TODO: compress with zlib
  //prepare the data and dataSz
  data = context.message.body;
  if (!Buffer.isBuffer(data) && typeof data !== 'string') {
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    } else {
      data = String(data);
    }
  }
  dataSz = data.length;

  if (!useChunk) {
    options.headers['content-length'] = dataSz;
  }

  logger.debug('invoke w/ headers: %j', options.headers);

  //write the request
  var http = isSecured ? require('https') : require('http');

  var request = http.request(options, function(response) {
    //read the response
    var target = context.message;

    target.statusCode = response.statusCode;
    target.statusMessage = response.statusMessage;
    logger.debug('invoke response: %d, %s', target.statusCode,
        target.statusMessage);

    target.headers = {};
    for (var hi in response.headers) {
      target.headers[hi] = response.headers[hi];
    }

    target.body = '';
    response.on('data', function(chunk) {
      target.body += chunk;
    });

    //TODO: check the mime type and convert the target.body to JSON?
    response.on('end', function() {
      logger.debug('invoke done');
      _next();
    });
  });

  //setup the timeout callback
  logger.debug('invoke set timeout to %s seconds', timeout);
  request.setTimeout(timeout * 1000, function() {
    logger.error('invoke policy timeouted');

    error.name = 'ConnectionError';
    error.message = 'Invoke policy timeout';

    _next(error);
  });
  logger.debug('Timeout is set to %d seconds.', timeout);

  //setup the error callback
  request.on('error', function(e) {
    logger.error('invoke policy failed: %s', e);

    error.name = 'ConnectionError';
    error.message = e.toString();

    _next(error);
  });

  request.write(data);
  request.end();
}

module.exports = function(config) {
  return invoke;
};
