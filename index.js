'use strict';
const fs         = require("fs");
const path       = require('path');
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
    var config  = undefined;
    var error   = undefined;
    //this function is used to interpret or resolve the place holder in the config properties
    var paramResolver = undefined;
    //store the tasks's setup functions
    var tasks   = undefined;
    var ctx = undefined;

    //step 1: loading the assembly yaml
    try {
        //TODO: this will be replaced by mplane later on
        //read config file here
        config = yaml.load(options.flow);

        //watch the config file
        fs.watchFile(options.flow, function (curr, prev) {
            //if file changes, reload it
            if ( curr.mtime > prev.mtime ) {
                logger.info("The config file is changed. Reload the file for the following requests.");
                try {
                    config = yaml.load(options.flow);
                    error = undefined;
                }
                catch (e2) {
                    logger.error("Failed to reload the config file: " + e2);
                    error = e2;
                }
            }
        });
    } catch (e) {
        logger.error("Failed to load the config file: " + e);
        error = e;
    }

    //step 2: loading the paramResolver if the 'paramResolver' presents
    try {
        // the callback function for resolving task's parameter values
        // TODO fix the issue of using '.' with path.join('.', 'someModule');
        //      Verify the test using mocha test case in test-flow.js
        // TODO paramResolver & task's base path must be the same???
        paramResolver = require(
                    path.join((options.baseDir ? options.baseDir : '') , options.paramResolver)
                )();
    } catch (e) {
        logger.error("Failed to load the paramResolver: " + e);
        logger.error("Continue the flow execution with no paramResolver");
    }

    //step 3: loading tasks module if there is
    tasks = loadTasks(options.tasks, options.baseDir);

    //step 4: prepare ctx if not ready
    ctx = options.context || context.createContext();

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
            var flow = new Flow(config, 
                    { 'paramResolver': paramResolver,
                       'baseDir': options.baseDir,
                       'tasks': tasks,
                    });
            ctx.set('req', req, true);
            ctx.set('res', res, true);
            flow.prepare(ctx, next);
            flow.run();
        }
    };
}

function loadTasks(tasks, baseDir) {
    var rev = {};
    var baseDir = baseDir || '';
    for(let name in tasks) {
        try {
            // TODO fix the issue of using '.' with path.join('.', 'someModule');
            //      Verify the test using mocha test case in test-flow.js
            let taskFunc = require(path.join(baseDir, tasks[name]));
            if ( !(taskFunc instanceof Function) ) {
                logger.error('task module:', name, 'is not a Function, skipped');
                continue;
            }
            rev[name] = taskFunc;
        } catch (e) {
            logger.error('failed to load task module:', name, e);
        }
    }
    console.error(rev);
    return rev;
}

module.exports.Flow = Flow;
module.exports.createContext = context.createContext;
