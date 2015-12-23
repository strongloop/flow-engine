/**
 * Fetch is a javascript based task. It is used to retrieve data over HTTP.
 **/
'use strict';

var util = require('util');
var http = require('http');
var url = require('url');

//TODO: should not use the relatvie path here
var Context = require('../../lib/context.js');

function _isValidString(prop) {
    if (util.isString(prop) && prop.length > 0)
        return true;
    return false;
}

//Fetch ctor
function Fetch(name, method, target) {
    this.mName = name;
    this.mMethod = method ? method : 'GET';
    this.mTarget = target;
}

Fetch.prototype.execute = function (session, input, resolve, reject) {
    if (this.mMethod !== 'GET' && this.mMethod !== 'POST') {
        var error = new Error('Invalid HTTP method "' + this.mMethod + '"');
        error.code = 'InvalidConfig';
        reject(error);
        return;
    }

    var options;
    try {
        var urlobj = url.parse(this.mTarget);
        if (urlobj.protocol !== 'http:' || !urlobj.hostname)
            throw new Error('Invalid protocol or hostname');

        options = {
            hostname: urlobj.hostname,
            port: urlobj.port ? urlobj.port : 80,
            path: urlobj.path,
            method: this.mMethod
        };
    }
    catch (error) {
        error.code = 'InvalidConfig';
        //invalid URL
        reject(error);
        return;
    }

    var req = http.request(options, function(res) {
        if (res.statusCode !== 200) {
            var error = new Error(res.statusCode + ': ' + res.statusMessage);
            error.code = 'ConnectionError';
            reject(error);
            return;
        }

        var data = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            data += chunk;
        });

        res.on('end', function() {
            var output = new Context();
            output.write(data);
            resolve(output);
        });
    });

    req.on('error', function(error) {
        error.code = 'ConnectionError';
        reject(error);
    });
    req.end();
};

//{ 'id': '001',
//  'name': 'foo',
//  'type': 'fetch',
//  'method': 'POST',
//  'target': 'http://9.191.74.66/firmware/msg.txt' }
function createTask(config) {
    if (util.isString(config.type) && config.type === 'fetch')
        if (_isValidString(config.name))
            if (_isValidString(config.method))
                if (_isValidString(config.target))
                    return new Fetch(config.name, config.method, config.target);

    return null;
}

module.exports.createTask = createTask;

