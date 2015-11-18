'use strict';
const EE         = require("events").EventEmitter;
const util       = require("util");
const assert     = require("assert");
const winston    = require("winston");
const context    = require('./context');

//TODO: create a logger for each flow instance
const gLogger     = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({"timestamp": true, "colorize": true, level: "info", label: 'Flow'})
    ]
});

var tidCounter = 1;
/**
 * enum for Flow's state
 */
const kInit = 0,
      kRunningFlow = 1,
      kRunningLocalError = 2,
      kRunningGlobalError = 3,
      kPrepareOutput = 4,
      kDone = 5,
      kAbort = 6,
      kInvalid = 7;

/**
 * Ctor function of Flow
 *
 * @param config is the flow (in JSON) to be executed
 * @param options option object
 *        parameters
 */
function Flow (config, options) {
    if ( !(this instanceof Flow) ) {
        return new Flow(config, options);
    }

    if ( !config ) {
        throw new SyntaxError("new Flow(config [, options])");
    }

    this._state = kInit;

    this._config = config;
    this._main = config.execute
    this._flowStack = [];
    this._flowID = 0;

    //to keep the flow error
    this._error = undefined;

    this._req       = undefined;
    this._resp      = undefined;
    this._next      = undefined;
    this._context   = undefined;
    this._options   = options;
    this.logger     = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(
                    {"timestamp": true, "colorize": true, level: "info", label: 'tid:' + (tidCounter++)})
        ]
    });
}
util.inherits(Flow, EE);

/**
 * store the request, response, and next()
 */
Flow.prototype.prepare = function ( req, resp, next ) {
    this.logger.debug("Preparing the flow");
    this._req = req;
    this._resp = resp;
    this._next = next;
    this._context = req.ctx || crateContext(req);
}

function createContext(req) {
    req.ctx = context.createContext(options.ctxScope);
    req.ctxNS = options.ctxScope;
    return req.ctx;
}

/**
 * start to excute the flow
 */
Flow.prototype.run = function () {
    var _this = this;
    this.logger.debug("Running the flow");
    this._context.set('logger', this.logger);
    this._evaluateState();
}

/**
 * check state
 */
Flow.prototype._evaluateState = function() {
    var _this = this;

    switch (this._state) {
    case kInit:
    {
        if ( this._main.length == 0 ) {
            this.logger.error("Found no task in the main flow. Aborting the execution");
            this._error = new Error("Found no task in the main flow");

            this._state = kAbort;
            this._evaluateState();
            return;
        }

        this.logger.info("Executing the main");
        this._flowStack.push({"id": this._flowID++, "taskIndex": 0, "flow": this._main});
        this._state = kRunningFlow;

        process.nextTick(function() {
            _this._prepareNextTask();
        });
        break;
    }
    case kRunningFlow:
    case kRunningLocalError:
    case kRunningGlobalError:
    {
        //move to the next task
        var current = this._flowStack[this._flowStack.length - 1];
        current.taskIndex++;

        process.nextTick(function() {
            _this._prepareNextTask();
        });
        break;
    }
    case kPrepareOutput:
    {
        //In the pure javascript flow engine, it is the task not the flow engine
        //to decidewhat to be written to response. For now, nothing is done in
        //the kPrepareOutput state.

        //We are done here
        this._state = kDone;
        process.nextTick(function() {
            _this._evaluateState();
        });
        break;
    }
    case kDone:
        this.logger.info("The flow is successfully executed.");

        //Every task in the flow is successfully executed. Call the next().
        process.nextTick(function() {
            _this._next();
        });
        break;
    case kAbort:
        this.logger.info("The flow is aborted.");

        if (!this._error)
            this.logger.warn("Internal error? The aborted reason is undefined.");

        //Some task fails and the error handler cannot deal with it. Call the
        //next() with the error.
        process.nextTick(function() {
            _this._next(_this._error);
        });
        break;
    case kInvalid:
        this.logger.error("Invalid state in Flow. Aborting the flow now.");
        var error = new Error("Invalid state in Flow Engine");

        process.nextTick(function() {
            _this._next(error);
        });
        break;
    default:
        break;
    }
}

/**
 * prepare and execute the next task
 */
Flow.prototype._prepareNextTask = function () {
    var current = this._flowStack[this._flowStack.length - 1];
    var task = current.flow[current.taskIndex];

    if ( task ) {
        this.logger.info ("loading task #" + current.id + "-" + current.taskIndex + ": ", JSON.stringify(task));
        var next = taskNext.bind(this, task);
        //save the next for error
        current['currTaskNext'] = next;
        try {
            var taskType = Object.getOwnPropertyNames(task)[0];
            var taskCfg = this._resolveTaskParam(task[taskType]);

            //initiate the task
            var taskModule;
            try {
               taskModule = require('./task/' + taskType);
            } catch (err) {
               taskModule = require(taskType);
            }
            var taskHandler = taskModule(taskCfg);
            //execute the task now
            taskHandler(this._req, this._resp, next, this._invokeFlow.bind(this));
        }
        catch ( e ) {
            this.logger.error("Exception with loading task #" + current.id + "-" + current.taskIndex + "\n" + e);
            next(e);
        }
    }
    else {
        //The last flow in the stack has finished
        if ( this._flowStack.length == 1 ) {
            this.logger.info("All tasks have been executed. Ready to call the next handler.");

            this._state = kPrepareOutput;
            this._evaluateState();
        }
        else {
            //A subflow may be invoked by a normal flow or error handler. Resume anyway
            if ( this._state == kRunningFlow ||
                 this._state == kRunningLocalError ||
                 this._state == kRunningGlobalError) {
                //Need to continue with the next task in the caller flow
                var subflow = this._flowStack.pop();
                var caller = this._flowStack[this._flowStack.length - 1];

                this.logger.info("The current subflow is done. Resume with the caller flow (id = " + caller.id + ", index=" + caller.taskIndex + ").");

                //bind the task to 'this' of its resume callback, and then call
                var task = caller.flow[caller.taskIndex];
                subflow.resume();
            }
            else {
                //should not reach here?!
            }
        }
    }
}

Flow.prototype._invokeFlow = function(subflow, callback) {
    //check the validness of the subflow and callback
    assert(subflow && (callback instanceof Function), "Invalid invocation of a subflow.");

    var current = this._flowStack[this._flowStack.length - 1];
    var task = current.flow[current.taskIndex];
    var taskType = Object.getOwnPropertyNames(task)[0];

    var newFlowID = this._flowID++;
    this.logger.info("A subflow (id=" + newFlowID + ") is invoked by the '" + taskType + "' task");

    //push the subflow onto the stack
    this._flowStack.push({"id": newFlowID, "taskIndex": 0, "flow": subflow, "resume": callback});

    var _this = this;
    process.nextTick(function() {
        _this._prepareNextTask();
    });
}


/**
 *  If user provides a custom task param resolve function, use it to resolve
 *  the parameter value.
 */
Flow.prototype._resolveTaskParam = function(taskCfg) {
    if (util.isUndefined(this._options.paramResolver)) {
        // no custom task parameters resolver provided, simply return
        return taskCfg;
    }

    this.logger.debug('Before resolve: ' + JSON.stringify(taskCfg, undefined, 2));
    var result = {};
    var _this = this;
    for (var key in taskCfg) {
        if (taskCfg.hasOwnProperty(key)) {
            var value = taskCfg[key];
            result[key] = util.isPrimitive(value) ?
                this._options.paramResolver(this._context, key, value) :
                _this._resolveTaskParam(value);
        }
    }
    this.logger.debug('After resolve: ' + JSON.stringify(result, undefined, 2));
    return result;
};

//This is a callback that will be passed to tasks. When a task finishes, it
//should invoke this callback to return control to the Flow.
//
//The arguments[0] has been bound to the task by the Flow. So tasks should just call
//next() or next(error).
function taskNext(task, error) {
    var error = arguments[1];
    if ( error ) {
        this.logger.error("The current task returned with an error '" + error + "'");

        if ( this._state == kRunningFlow ) {
            var current = this._flowStack[this._flowStack.length - 1];

            //TODO: get the error handler and push it onto this._flowStack
            //if ( task.localError )
            //    this._state = kRunningLocalError;
            //else
            //    this._state = kRunningGlobalError;

            //directly abort it for now
            this._error = error;
            this._state = kAbort;
        }
        else if ( this._state == kRunningGlobalError ) {
            this.logger.error("Found an error in the global error handler: " + error);
            this._error = error;
            this._state = kAbort;
        }
        else if ( this._state == kRunningLocalError) {
            this.logger.error("Found an error in the local error handler: " + error);
            //TODO: check for the outer local error handler, or the global error handler
        }
    }

    this._evaluateState();
}

exports.Flow = Flow;
