/**
 * JsonValidate is used to validate a JSON object.
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

//JsonValidate ctor
function JsonValidate(name, jsvUrl) {
    this.mName = name;
    this.mJsvURL = jsvUrl;
}

JsonValidate.prototype.execute = function (session, input, resolve, reject) {
    //Parse the JSV URL
    var options;
    try {
        var urlobj = url.parse(this.mJsvURL);
        if (urlobj.protocol !== 'http:' || !urlobj.hostname)
            throw new Error('Invalid protocol or hostname');

        options = {
            hostname: urlobj.hostname,
            port: urlobj.port ? urlobj.port : 80,
            path: urlobj.path,
            method: 'GET'
        };
    }
    catch (error) {
        error.code = 'InvalidConfig';
        //invalid URL
        reject(error);
        return;
    }

    //Fetch the JSV over HTTP
    var req = http.request(options, function(res) {
        if (res.statusCode !== 200) {
            var error = new Error(res.statusCode + ': ' + res.statusMessage);
            error.code = 'CannotReadJSV';
            reject(error);
            return;
        }

        var schema = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
            schema += chunk;
        });

        res.on('end', function() {
            try {
                schema = JSON.parse(schema);
            }
            catch (error) {
                error.code = 'InvalidSchema';
                reject(error);
                return;
            }

            input.readAsBuffer(function(error, buffer){
                if (error) {
                    reject(error);
                    return;
                }

                var output = new Context();
                try {
                    var obj = JSON.parse(buffer);

                    var Validator = require('jsonschema').Validator;
                    var v = new Validator();
                    var result = v.validate(obj, schema);

                    if (result.errors.length > 0) {
                        output.setVar('validation_result', false);
                        output.setVar('validation_error_detail',
                            JSON.stringify(result.errors));
                    }
                    else
                        output.setVar('validation_result', true);

                    //TODO: jsonvalidate doesn't produce any payload
                    output.write(obj);

                    //TODO: should we resolve or reject if the validation fails?
                    resolve(output);
                }
                catch (error) {
                    output.setVar('validation_result', false);
                    output.setVar('validation_error_detail',
                            JSON.stringify(error));

                    resolve(output);
                }
            });
        });
    });

    req.on('error', function(error) {
        error.code = 'CannotReadJSV';
        reject(error);
    });
    req.end();
};

//{ 'id': '001',
//  'name': 'foo',
//  'type': 'jsonvalidate',
//  'jsvUrl': 'http://9.191.74.66/firmware/type_address.jsv' }
function createTask(config) {
    if (util.isString(config.type) && config.type === 'jsonvalidate')
        if (_isValidString(config.name))
            if (_isValidString(config.jsvUrl))
                return new JsonValidate(config.name, config.jsvUrl);

    return null;
}

module.exports.createTask = createTask;

