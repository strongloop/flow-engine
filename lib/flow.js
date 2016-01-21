'use strict';
const EE         = require('events').EventEmitter;
const util       = require('util');
const assert     = require('assert');
const winston    = require('winston');

var tidCounter = 1;

/**
 * A flow begins with the state kInit, and ends with either kDone or kAbort.
 *
 * When the flow begins, it is in the kInit state. If there isn't any policy in
 * the assembly, the flow moves to kAbort state directly. Otherwise, it moves to
 * kExecMain and starts to execute the assembly.
 *
 * If the assembly completes without error, the flow moves to kPrepareOutput and
 * kDone. However, if there is error, its *matching* local error handler will be
 * invoked. The local error handler might either succeed or fail. If it is a
 * success, the remaining flow will be resumed and move to kDone in the end. If
 * it is a failure, the flow will move to kExecGlobalError and invoke the global
 * error handler.
 *
 * If the global error handler completes without error, the flow moves to
 * kPrepareOutput and kDone. However, if there is error, the *matching* local
 * error handler will be invoked (YES! Users might configure a local error
 * handler inside the global error handler). If the local error handler
 * succeeds, the global error handler will be resumed and the flow will move to
 * kDone. Otherwise, the flow moves to kAbort.
 *
 * note: in this document, some terms are used interchangably, for example:
 *     1. task and policy
 *     2. assembly and flow
 *
 * enum for Flow's state:
 *
 * - kInit: when the flow begins.
 * - kExecMain: in the main flow.
 * - kExecGlobalError: in the global error handler.
 * - kPrepareOutput: prepare the responseand move to the kDone right away.
 * - kDone: when the flow completes.
 * - kAborted: when the flow fails.
 */
const kInit = 0,
      kExecMain = 1,
      kExecGlobalError = 2,
      kPrepareOutput = 3,
      kDone = 4,
      kAbort = 5;

/**
 * A flow is composed of one or more policies. Each policy is used to perform
 * a specific task. For example, the activity-log policy is used to record the
 * request activity. The policies are executed one after another. However, there
 * are some policies that can be used to invoke subflows. For example, the
 * 'operation-switch' policy is used to invoke different subflows for different
 * operations. Just like the flow, a subflow is also composed of one or more
 * policies. The entry flow is considered as 'main'.
 *
 * In addition to main flow and subflows, the error handlers are also a series
 * of policies. A main flow may have a global error handler while every policy
 * may define its own one. Such error handlers are local error handlers.
 *
 *
 * enum of the flow type:
 *
 * kMain: the main flow
 * kSubflow: a subflow invoked by other flows
 * kLocalHandler: a local error handler, invoked when it knows how to deal with
 *      the current error.
 * kGlobalHandler: the global error handler, invoked when no local error handler
 *      is able to handle the current error.
 */
const kMain = 0,
      kSubflow = 1,
      kLocalHandler = 2,
      kGlobalHandler = 3;

/**
 * FlowStackObj is an internal object that is saved onto the flow stack.
 *
 * @param id The flow id
 * @param flow The assembly, including a serial of policies
 * @param type The flow type (kMain, kSubflow, kLocalHandler, or kGlobalHandler)
 * @param options Used to specify the custom task function and paramResolver.
 * @param parent The parent flow (a FlowStackObj), if the task function or
 *        paramResolver in current object doesn't present, look it up in the
 *        parent.options
 * @param resume The callback invoked to resume the calling policy of a subflow
 * @param catch A subflow may have an optional error handler, and this optional
 *        error handler is saved in @catch.
 */
function FlowStackObj(id, flow, type, options, parent, resume) {
    this.id = id;
    this.flow = flow;
    this.flowType = type;
    this.options = options || {};
    this.parent = parent;
    this.resume = resume;

    this.taskIndex = 0;
}

FlowStackObj.prototype.getTaskFunc = function(taskName) {
    var rev;
    if ( this.options.tasks && this.options.tasks[taskName] ) {
        rev = this.options.tasks[taskName];
    } else if ( this.parent ) {
        rev = this.parent.getTaskFunc(taskName);
    }
    return rev;
};

FlowStackObj.prototype.getParamResolver = function() {
    var rev;
    if ( this.options.paramResolver ) {
        rev = this.options.paramResolver;
    } else if ( this.parent ) {
        rev = this.parent.getParamResolver();
    }
    return rev;
};

/**
 * Ctor function of Flow
 *
 * @param config the flow (or the assembly) to be executed
 * @param options the parameters, including:
 *        - paramResolver: the parameter resolver
 *        - basedir: the working directory, for loading the other files.
 *        - tasks: the custom policies to be executed
 */
function Flow (config, options) {
    if ( !(this instanceof Flow) ) {
        return new Flow(config, options);
    }

    if ( !config ) {
        throw new SyntaxError('new Flow(config [, options])');
    }

    if (!config.assembly || !config.assembly.execute) {
        throw new ReferenceError(
                'Cannot find the assembly.execute in the config.');
    }

    this._state = kInit;

    this._config = config;
    this._main = config.assembly.execute;
    this._globalErrorHandler = config.assembly.catch;
    this._flowStack = [];
    this._flowID = 0;

    //to keep the flow error
    this._error = undefined;

    this._next      = undefined;
    this._context   = undefined;

    this.logger     = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(
                    {'timestamp': true,
                     'colorize': true,
                     'level': 'debug',
                     'label': 'tid:' + (tidCounter++)})
        ]
    });

    this._options = options;
    //initialize the custom policy if needed
    this._options.tasks = options.tasks || {};
}
util.inherits(Flow, EE);

/**
 * Setup the flow, ex: save the context object.
 */
Flow.prototype.prepare = function ( ctx, next ) {
    this.logger.debug('Preparing the flow');

    this._next = next;
    this._context = ctx;

    //Save the logger on the context object
    this._context.set('logger', this.logger, true);

    //Save the invoke function on the context object
    var flow = {};
    Object.defineProperty(flow, 'invoke',
            { 'value': invokeFlow.bind(this),
              writable: false,
              enumerable: true,
              configurable: false } );
    this._context.set('flow', flow, true);
};

/**
 * start to excute the flow
 */
Flow.prototype.run = function () {
    this.logger.debug('Running the flow');
    this._evaluateState();
};

/**
 * check state
 */
Flow.prototype._evaluateState = function() {
    var _this = this;

    switch (this._state) {
    case kInit:
    {
        if ( this._main.length === 0 ) {
            this.logger.error('Found no policy in the assembly. Abort now');

            this._error = {
                'name': 'config error',
                'value': 'no policy',
                'message': 'Found no policy in the assembly.'
            };
            this._state = kAbort;
            this._evaluateState();
            return;
        }

        this.logger.info('Executing the assembly');
        this._flowStack.push(new FlowStackObj(
                    this._flowID++, this._main, kMain, this._options));
        this._state = kExecMain;
    }
    /* falls through */
    case kExecMain:
    case kExecGlobalError:
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
        //to decide what to be written to response. For now, nothing is done in
        //the kPrepareOutput state.

        //We are done here
        this._state = kDone;
        process.nextTick(function() {
            _this._evaluateState();
        });
        break;
    }
    case kDone:
        this.logger.info('The flow is completed.');

        //Every task in the flow is successfully executed. Call the next().
        process.nextTick(function() {
            _this._next();
        });
        break;
    case kAbort:
        this.logger.info('The flow is aborted.');

        if (!this._error) {
            this.logger.warn('Unknown error? The abort reason is undefined.');
            this._error = {
                'name': 'flow error',
                'value': 'unknown error',
                'message': 'The abort reason is undefined. Could be a bug'
            };
        }

        //Some task fails and the error handler cannot deal with it. Call the
        //next() with the error.
        process.nextTick(function() {
            _this._next(_this._error);
        });
        break;
    default:
        this.logger.error('Invalid state. Could be a bug');
        this._error = {
            'name': 'flow error',
            'value': 'invalid state',
            'message': 'Invalid state. Could be a bug'
        };

        process.nextTick(function() {
            _this._next(_this._error);
        });
        break;
    }
};

/**
 * prepare and execute the next task
 */
Flow.prototype._prepareNextTask = function () {
    var current = this._flowStack[this._flowStack.length - 1];
    var task = current.flow[current.taskIndex];

    if ( task ) {
        var taskType = Object.getOwnPropertyNames(task)[0];
        this.logger.info('loading the policy "%s" (id=%d, index=%d)',
                taskType, current.id, current.taskIndex, {});

        var next = taskNext.bind(this, task);
        try {
            var paramResolver = current.getParamResolver();
            var taskCfg = this._resolveTaskParam(paramResolver, task[taskType]);

            //initiate the task
            var taskModule;
            try {
               taskModule = current.getTaskFunc(taskType) ||
                   require('./task/' + taskType);
            } catch (err) {
               taskModule = require(taskType);
            }
            var taskHandler = taskModule(taskCfg);
            //execute the task now
            taskHandler(this._context, next);
        }
        catch ( e ) {
            this.logger.error('Exception with loading policy "%s" (id=%d, ' +
                        'index=%d): %s', taskType, current.id,
                        current.taskIndex, e, {});

            //end the task here by calling taskNext(e)
            next(e);
        }
    }
    else {
        if ( this._flowStack.length === 1 ) {
            //The last flow on the stack has finished
            this.logger.info('All flows on the stack have been executed.');

            var lastOne = this._flowStack.pop();
            assert(lastOne.flowType === kMain ||
                   lastOne.flowType === kGlobalHandler,
                   !'The bottom flow is either the main or global handler');

            this._state = kPrepareOutput;
            this._evaluateState();
        }
        else {
            //There is still the other flow(s) on the stack
            assert(this._state === kExecMain ||
                   this._state === kExecGlobalError);

            //The flow is completed. Continue with the next flow on the stack
            var finished = this._flowStack.pop();
            var nextFlow = this._flowStack[this._flowStack.length - 1];

            if ( finished.resume ) {
                assert(finished.flowType === kSubflow,
                        !'Only subflows can have resume callbacks');

                this.logger.info('The current subflow is done. ' +
                        'Continue with the calling policy (id=%d, index=%d).',
                        nextFlow.id, nextFlow.taskIndex);

                //Continue with the calling policy
                finished.resume();
            }
            else {
                assert(finished.flowType === kLocalHandler);

                this.logger.info('The local error handler has recovered the ' +
                        'error. Resume the remaining flow (id=%d)',
                        nextFlow.id);

                //The local error handler successfully finished, so we can
                //consider the bad task is recovered. It's time to move forward
                nextFlow.taskIndex++;
                this._evaluateState();
            }
        }
    }
};


/**
 *  If user provides a custom task param resolve function, use it to resolve
 *  the parameter value.
 */
Flow.prototype._resolveTaskParam = function(paramResolver, taskCfg) {
    if (util.isUndefined(paramResolver)) {
        // no custom task parameters resolver provided, simply return
        return taskCfg;
    }

    var result = {};
    for (var key in taskCfg) {
        if (taskCfg.hasOwnProperty(key)) {
            var value = taskCfg[key];
            //TODO: resolving all of the descending properties may cause issues
            //skip the 'execute' and 'catch' property for now
            //might need to move the following logics into paramResolver
            if ( key === 'execute' || key === 'catch' ) {
                result[key] = value;
            }
            else {
                //If the value is an object, resolve its descending properties.
                result[key] = util.isPrimitive(value) ?
                        paramResolver(this._context, key, value) :
                            this._resolveTaskParam(paramResolver, value);
            }
        }
    }

    return result;
};


////////////////////////////////////////////////////////////////////////////////
// The error handling
////////////////////////////////////////////////////////////////////////////////
/*
Say we have the main flow, and the subflows S1, S2, and S3 on the stacks. In our
example, the policies that invoke the subflow (C1, C2, C3) all specify the local
error handlers (L1, L2, L3) to take care of specific error cases (ex: L1 can
deal with error 'a' and 'b').

Now we run into an error 'd' in subflow S3. Check the [x] in S3. Unfortunately,
the task at fault doesn't have its own local error handler, so we need to look
for the error handlers in the policies C3, C2, and C1. The policy C3 does have
a local error handler L3, but it doesn't deal with error 'd'. Then comes the L2.
L2 knows how to deal with the error 'd'.

          L1 <a,b>
M: [t1]--[C1]--[t2]-->
          |
          |        L2 <c,d,e>
       S1 +-[t3]--[C2]--[t4]--[t5]-->
                   |
                   |        L3 <f,g>
                S2 +-[t6]--[C3]-->
                            |
                         S3 +-[t7]--[t8]--[x]--[t9]-->
                                         error=d

We need to invoke the L2 to handle the error 'd'. After L2 completes, the flow
will continue with the task 't4' in S1. To invoke L2, we pop S2 and S3 and push
L2 onto stack. So here's the stack after we invoke the L2.

          L1 <a,b>
M: [t1]--[C1]--[t2]-->
          |
          |        L2 <c,d,e>
       S1 +-[t3]--[C2]--[t4]--[t5]-->
                   x
                   |
     (error=d) L2: +-[t10]--[t11]--[t12]--[t13]-->
                           error=?

- If L2 completes with no error, the flow continues with the task 't4' in S1.

- If L2 fails in the task t11 for example, we check first if t11 got its own
  error handler:

  - YES, we push t11's error handler onto the stack immediately, or

  - NO, both of L2 and S1 must be terminated. We pop L2 and S1 out of the
    stack, and check if the L1 can handle the latest error. If yes, L1 will be
    pushed onto the stack. Otherwise, we pop all the rest of flows and push the
    global error handler onto the stack. In the beginning of kExecGlobalError,
    the global error handler is the only flow on the stack.


Note that a global error handler may invoke a subflow or specify the local error
handler for its own tasks, like the below example. So the same logics apply to
both of the main and the global error handler.

GEH: [t14]--[C1]--[t15]-->
             |
             |         L4
          S4 +-[t16]--[t17]--[t18]-->
*/

//This is a callback that will be passed to tasks. When a task finishes, it
//should invoke this callback to return control to the Flow.
//
//The arguments[0] has been bound to the task by the Flow. So tasks should just
//call next() or next(error) to transfer control to Flow.
function taskNext() {
    var caller = arguments[0];
    var error = arguments[1];

    /* jshint validthis: true */
    var that = this;
    var currFlow;
    if ( error === undefined ) {
        //Good. Move forward now
        currFlow = that._flowStack[that._flowStack.length - 1];
        currFlow.taskIndex++;
    }
    else {
        that.logger.error('The policy "%s" returned with an error: %j',
                Object.getOwnPropertyNames(caller)[0], error, {});

        //Oops. update the context.error
        that._context.error = error;

        var handler;
        var resolvedCatch;
        var newFlow;
        //look for a local error handler
        while (that._flowStack.length > 0) {
            currFlow = that._flowStack[that._flowStack.length - 1];
            var currTask = currFlow.flow[currFlow.taskIndex];
            var type = Object.getOwnPropertyNames(currTask)[0];

            that.logger.debug('Looking for error handler in the policy "%s" ' +
                    '(id=%d, index=%d)', type, currFlow.id, currFlow.taskIndex);

            resolvedCatch = that._resolveTaskParam(
                    currFlow.getParamResolver(), currTask[type].catch);
            handler = that.findMatchingErrorHandler(resolvedCatch);

            //Found the handler. Push the local handler flow onto the stack.
            //When the handler flow is done, the current flow will be resumed.
            if (handler) {
                newFlow = new FlowStackObj(
                        that._flowID++, handler, kLocalHandler, {}, currFlow);
                that._flowStack.push(newFlow);

                that.logger.info('Found the error handler in policy "%s"' +
                    '(id=%d, index=%d). Invoke it with id "%d"',
                    type, currFlow.id, currFlow.taskIndex, newFlow.id);
                break;
            }

            //Special case for the dynamic flows (that are added to stack via
            //the invokeFlow call). If the dynamic flow got its own error
            //handler, let's give it a try.
            if (currFlow.catch) {
                that.logger.debug('Looking for error handler in the dynamic ' +
                        'flow (id=%d)', currFlow.id);
                resolvedCatch = that._resolveTaskParam(
                        currFlow.getParamResolver(), currFlow.catch);
                handler = that.findMatchingErrorHandler(resolvedCatch);

                if (handler) {
                    var f0 = that._flowStack.pop();
                    newFlow = new FlowStackObj(that._flowID++,
                            handler, kLocalHandler, {}, f0.parent);
                    that._flowStack.push(newFlow);

                    that.logger.info('The dynamic flow (id=%d) aborted. ' +
                            'Invoke its error handler with id "%d" now.',
                            f0.id, newFlow.id);
                    break;
                }
            }

            if (currFlow.flowType === kLocalHandler) {
                //The current flow itself is a local error handler, and it runs
                //into another error. We are left with no choice but to pop the
                //handler and the flow that provides the handler out of stack.
                var f1 = that._flowStack.pop();
                var f2 = that._flowStack.pop();
                assert(f1 && f2);

                that.logger.info('The local error handler (id=%d) and its ' +
                        'upper flow (id=%d) cannot deal with the error. Abort' +
                        ' them now.', f1.id, f2.id);
            }
            else {
                //The current flow cannot deal with this error. Pop it.
                var f3 = that._flowStack.pop();
                assert(f3 === currFlow);

                that.logger.info('The flow (id=%d) cannot deal with the error' +
                        '. Abort now.', f3.id);
            }
        }

        //Can we turn to the global error handler?
        if (!handler) {
            assert(that._flowStack.length === 0);

            if (that._state === kExecMain) {
                //check if the global error handler can deal with the error
                resolvedCatch = that._resolveTaskParam(
                        that._options.paramResolver, that._globalErrorHandler);
                handler = that.findMatchingErrorHandler(resolvedCatch);

                if (handler) {
                    //Yes, the global error handler can help. Push it onto stack
                    var gFlow = new FlowStackObj(that._flowID++,
                            handler, kGlobalHandler, that._options);
                    that._flowStack.push(gFlow);

                    that._state = kExecGlobalError;
                    that.logger.info('Invoke the global error handler with id' +
                            ' "%d" to deal with the error.', gFlow.id);
                }
                else {
                    //Unfortunately, the global error handler can't help.
                    that.logger.info('No global error handler can deal with ' +
                            'the error. Abort now.');

                    that._error = that._context.error;
                    that._state = kAbort;
                }
            }
            else if (that._state === kExecGlobalError) {
                that.logger.info('Failed to handle the error in the global ' +
                        'error handler. Abort now.');

                that._error = that._context.error;
                that._state = kAbort;
            }
            else
                assert(!'Should not reach here');
        }
    }

    that._evaluateState();
}

Flow.prototype.findMatchingErrorHandler = function(catchClause) {
    if (!catchClause)
        return undefined;

    for (var i in catchClause) {
        var theCase = catchClause[i];
        //a case must have either the 'errors' or 'default' property
        if (theCase.errors) {
            for (var j in theCase.errors) {
                var text = theCase.errors[j];
                var real = this._context.error;

                //errors returned by policies are supposed to be ojects, ex:
                //  { name: ..., value: ..., message: ... }
                if (real && real instanceof Object && real.name) {
                    if (real.name === text) {
                        this.logger.info('The case "%s" is matched', text);
                        return theCase.execute;
                    }
                }
                //just in case some policies don't return errors in objects
                else if (typeof real === 'string' && real === text) {
                    this.logger.info('The case "%s" is matched', text);
                    return theCase.execute;
                }

                this.logger.debug('The case "%s" is not matched', text);
            }
        }
        else if (theCase.default) {
            this.logger.info('Use the default case');
            return theCase.default;
        }
        else
            this.logger.warn('An invalid case %j? Got to skip it. ', theCase);
    }
};

/**
 * A policy can invoke a subflow via this function. For example, the built-in
 * policy 'operation-switch'. Users can write a custom policy to invoke a
 * subflow too. If the custom policy would like to provide a custom error
 * handler, they can provide an assembly of JSON object:
 *     { execute: <the subflow>, catch: <error handler> }
 *
 * @param assembly is a JSON object. Check the above example.
 * @param next a callback to notify the parent policy that the subflow is done.
 * @param options a custom param resolver for example.
 */
function invokeFlow(assembly, next, options) {
    //check the validness of the assembly and callback
    assert(assembly && assembly.execute && (next instanceof Function),
            'Invalid invocation of a subflow.');

    /* jshint validthis: true */
    var that = this;

    var stackTop = that._flowStack[that._flowStack.length - 1];
    var caller= stackTop.flow[stackTop.taskIndex];
    var taskType = Object.getOwnPropertyNames(caller)[0];

    var newFlowID = that._flowID++;
    that.logger.info('A subflow is invoked with id "%s" by the "%s" policy',
            newFlowID, taskType);

    //create the subflow, and save its own error handler if any.
    var subflow = new FlowStackObj(
            newFlowID, assembly.execute, kSubflow, options, stackTop, next);
    if (assembly.catch)
        subflow.catch = assembly.catch;

    //push the subflow onto the stack
    that._flowStack.push(subflow);

    process.nextTick(function() {
        that._prepareNextTask();
    });
}

exports.Flow = Flow;
