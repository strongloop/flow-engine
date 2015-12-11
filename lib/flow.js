'use strict';
const EE         = require("events").EventEmitter;
const util       = require("util");
const assert     = require("assert");
const vm         = require('vm');
const winston    = require("winston");
const context    = require('./context');
const path       = require("path");

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

    if (!config.assembly || !config.assembly.execute) {
        throw new ReferenceError("Cannot find the assembly.execute in the config.");
    }

    this._state = kInit;

    this._config = config;
    this._main = config.assembly.execute
    this._globalErrorHandler = config.assembly.catch;
    this._flowStack = [];
    this._flowID = 0;

    //to keep the flow error
    this._error = undefined;

    this._next      = undefined;
    this._context   = undefined;
    this._options   = options;
    this.logger     = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(
                    {"timestamp": true, "colorize": true, level: "info", label: 'tid:' + (tidCounter++)})
        ]
    });
    //initial _options.tasks if needed
    this._options.tasks = options.tasks || {};
}
util.inherits(Flow, EE);

/**
 * store the request, response, and next()
 */
Flow.prototype.prepare = function ( ctx, next ) {
    this.logger.debug("Preparing the flow");
    this._next = next;
    this._context = ctx;
    var flow = {};
    Object.defineProperty(flow, 'invoke', 
            { 'value': invokeFlow.bind(this), 
              writable: false,
              enumerable: true,
              configurable: false } );
    this._context.set('flow', flow, true);
}

/**
 * start to excute the flow
 */
Flow.prototype.run = function () {
    var _this = this;
    this.logger.debug("Running the flow");
    this._context.set('logger', this.logger, true);
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

        //fall through, don't break
        //break;
    }
    case kRunningFlow:
    case kRunningLocalError:
    case kRunningGlobalError:
    {
        //prepare the next task
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
        this.logger.info ("loading task #", current.id, "-" + current.taskIndex, ": ", JSON.stringify(task));
        var next = taskNext.bind(this, task);
        //save the next for error
        current['currTaskNext'] = next;
        try {
            var taskType = Object.getOwnPropertyNames(task)[0];
            var taskCfg = this._resolveTaskParam(task[taskType]);

            //initiate the task
            var taskModule;
            try {
               taskModule = this._options.tasks[taskType]
                   || require('.' + path.sep + path.join('task', taskType));
            } catch (err) {
               taskModule = require(taskType);
            }
            var taskHandler = taskModule(taskCfg);
            //execute the task now
            taskHandler(this._context, next);
        }
        catch ( e ) {
            this.logger.error("Exception with loading task #", current.id, "-", current.taskIndex, "\n", e);
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

                this.logger.info("The current subflow is done. Resume with the caller flow (id = ", caller.id, ", index=", caller.taskIndex, ").");

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


/**
 *  If user provides a custom task param resolve function, use it to resolve
 *  the parameter value.
 */
Flow.prototype._resolveTaskParam = function(taskCfg) {
    if (util.isUndefined(this._options.paramResolver)) {
        // no custom task parameters resolver provided, simply return
        return taskCfg;
    }

    this.logger.debug('Before resolve: ', JSON.stringify(taskCfg, undefined, 2));
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
    this.logger.debug('After resolve: ', JSON.stringify(result, undefined, 2));
    return result;
};

//This is a callback that will be passed to tasks. When a task finishes, it
//should invoke this callback to return control to the Flow.
//
//The arguments[0] has been bound to the task by the Flow. So tasks should just call
//next() or next(error).
function taskNext(task, error) {
    var error = arguments[1];

    if ( !error ) {
        //Good. Move forward now
        var current = this._flowStack[this._flowStack.length - 1];
        current.taskIndex++;
    }
    else {
        //Oops. update the context.error
        this._context.error = error;

        this.logger.error("The task '", Object.getOwnPropertyNames(task)[0], "' returned with an error '", JSON.stringify(error), "'");

        if ( this._state == kRunningFlow ) {
            //try the local error handler
            var errorHandler = undefined;
            do {
                var current = this._flowStack[this._flowStack.length - 1];
                var task = current.flow[current.taskIndex];
                var taskType = Object.getOwnPropertyNames(task)[0];
                var taskCfg = this._resolveTaskParam(task[taskType]);
                this._flowStack.pop();

                this.logger.debug("Looking the local error handler in task '", taskType, "'");
                if (taskCfg.catch) {
                    errorHandler = this.findMatchingErrorHandler(taskCfg.catch, error);
                    if (errorHandler) {
                        this.logger.info("Invoke the local error handler from the activity'", taskType, "'");

                        this._state = kRunningLocalError;
                        this._flowStack.push({"id": this._flowID++, "taskIndex": 0, "flow": errorHandler, "isErrorHandler": true});
                        break;
                    }
                }
            } while (!errorHandler && this._flowStack.length > 0);

            //try the global error handler
            if (!errorHandler) {
                this.logger.info("Cannot find the local error handler.");

                if (this._globalErrorHandler)
                    errorHandler = this.findMatchingErrorHandler(this._globalErrorHandler, error);

                if (errorHandler) {
                    this.logger.info("Invoke the global error handler.");

                    //invoke the error handler
                    this._state = kRunningGlobalError;
                    this._flowStack.push({"id": this._flowID++, "taskIndex": 0, "flow": errorHandler, "isErrorHandler": true});
                }
                else {
                    this.logger.info("Cannot find the global error handler either. Abort now");

                    this._error = error;
                    this._state = kAbort;
                }
            }
        }
        else if ( this._state == kRunningLocalError) {
            this.logger.error("Found an error in the local error handler: ", error);

            //remove the local error flow
            this._flowStack.pop();

            if (this._globalErrorHandler)
                errorHandler = this.findMatchingErrorHandler(this._globalErrorHandler, error);

            if (errorHandler) {
                this.logger.info("Turn to the global error handler.");

                //invoke the error handler
                this._state = kRunningGlobalError;
                this._flowStack.push({"id": this._flowID++, "taskIndex": 0, "flow": errorHandler, "isErrorHandler": true});
            }
            else {
                this.logger.info("Cannot find the global error handler. Abort now");

                this._error = error;
                this._state = kAbort;
            }
        }
        else if ( this._state == kRunningGlobalError ) {
            this.logger.error("Found an error in the global error handler: ", error);
            this._error = error;
            this._state = kAbort;
        }
        else {
            //TODO: should not be reached. Abort here!
            this._error = error;
            this._state = kAbort;
        }
    }

    this._evaluateState();
}

Flow.prototype.findMatchingErrorHandler = function(catchClause, error) {
    for (var i in catchClause) {
        var errCase = catchClause[i];
        if (errCase.errors) {
            for (var test in errCase.errors) {
                var text = errCase.errors[test];
                try {
                    var sandbox = {
                        context: this._context,
                        request: this._context.req,
                        response: this._context.res
                    };

                    var fakeCtx = new vm.createContext(sandbox);
                    var script = new vm.Script(text);
                    var result = script.runInContext(fakeCtx);

                    if (result === true)
                        return errCase.execute;
                }
                catch (ex) {
                    //ok to got the exception. Treat it as not-match
                    this.logger.info("Applying '", text, "' to ", JSON.stringify(error), " and got the exception: ", ex);
                }
            }
        }

        if (errCase.default)
            return errCase.default;
    }
}

function invokeFlow(subflow, next) {
    //check the validness of the subflow and callback
    assert(subflow && (next instanceof Function), "Invalid invocation of a subflow.");

    var current = this._flowStack[this._flowStack.length - 1];
    var task = current.flow[current.taskIndex];
    var taskType = Object.getOwnPropertyNames(task)[0];

    var newFlowID = this._flowID++;
    this.logger.info("A subflow (id=", newFlowID, ") is invoked by the '", taskType, "' task");

    //push the subflow onto the stack
    this._flowStack.push({"id": newFlowID, "taskIndex": 0, "flow": subflow, "resume": next});

    var _this = this;
    process.nextTick(function() {
        _this._prepareNextTask();
    });
}

exports.Flow = Flow;
