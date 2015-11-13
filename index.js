'use strict';
const fs         = require("fs");
const yaml       = require("yamljs");
const winston    = require("winston");
const Flow       = require('./lib/flow').Flow;
const context    = require('./lib/context');

//TODO: create a logger for each flow instance
const logger     = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({"timestamp": true, "colorize": true, level: "debug"})
    ]
});

//middleware ctor function
//passing in the config file via options
module.exports = function(options) {
    var config = undefined;
    var error = undefined;
    try {
        //TODO: this will be replaced by mplane later on
        //read config file here
        config = yaml.load(options.config);

        //watch the config file
        fs.watchFile(options.config, function (curr, prev) {
            //if file changes, reload it
            if ( curr.mtime > prev.mtime ) {
                logger.info("The config file is changed. Reload the file for the following requests.");
                try {
                    config = yaml.load(options.config);
                    error = undefined;
                }
                catch (e2) {
                    logger.error("Failed to reload the config file: " + e2);
                    error = e2;
                }
            }
        });
    }
    catch (e) {
        logger.error("Failed to load the config file: " + e);
        error = e;
    }

    //return the middleware function
    return function (req, res, next) {
        if ( error ) {
            logger.info("Go to the error middleware");

            //error with loading the config file. Go to the error middleware
            next(error);
        }
        else {
            logger.info("Invoke the Flow middleware");

            //start to run the flow engine
            var flow = new Flow(config);
            flow.prepare(req, res, next);
            flow.run();
        }
    };
}

module.exports.Flow = Flow;
module.exports.Context = context;
