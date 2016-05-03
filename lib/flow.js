// Copyright IBM Corp. 2015,2016. All Rights Reserved.
// Node module: flow-engine
// US Government Users Restricted Rights - Use, duplication or disclosure
// restricted by GSA ADP Schedule Contract with IBM Corp.

/*eslint-env node */
'use strict';
var util = require('util');
var assert = require('assert');
var bunyan = require('bunyan');
var Observable = require('./observer');

/* jslint bitwise: true */
var tidCounter = Math.random() * 10 | 1;

/**
 * get tid and increase its value by random value
 *
 * @returns {Number}
 */
function tid() {
  /* jslint bitwise: true */
  tidCounter += Math.random() * 10 | 1;
  return tidCounter;
}

// global logger instance
var gLogger = bunyan.createLogger(
  {
    name: 'flow-engine',
    stream: process.stdout,
    level: 'info',
  });
/*
 * A flow begins with the state kInit, and ends with either kDone or kAbort.
 *
 * When the flow begins, it is in the kInit state. If there isn't any policy in
 * the assembly, the flow moves to kAbort state directly. Otherwise, it moves to
 * kRunning and starts to execute the assembly.
 *
 * If the assembly completes without error, the flow moves to kPrepareOutput and
 * kDone. However, if there is error, the flow engine invokes a suitable error
 * handler to fix the problem. The error handler might either succeed or fail.
 * If it is a success, the remaining flow will be resumed and move to kDone in
 * the end. If it is a failure, the global error handler will be invoked.
 *
 * If the global error handler completes without error, the flow moves to
 * kPrepareOutput and kDone. However, if there is error unrecoverable in the
 * global error handler, the flow moves to kAbort.
 *
 * note: in this document, some terms are used interchangably, for example: 1.
 * task and policy 2. assembly and flow ** enum for Flow's state: - kInit: when
 * the flow begins. - kRunning: executing the flow - kPrepareOutput: prepare the
 * responseand move to the kDone right away. - kDone: when the flow completes. -
 * kAborted: when the flow fails.
 */
var kInit = 0;
var kRunning = 1;
var kPrepareOutput = 2;
var kDone = 3;
var kAbort = 4;

/*
 * A flow is composed of one or more policies. Each policy is used to perform a
 * a specific task. For example, the activity-log policy is used to record the
 * request activity. The policies are executed one after another. There are some
 * special policies that can be used to invoke subflows. For example, the
 * 'operation-switch' policy is used to invoke different subflows for different
 * operations. After the subflow finishes, the main flow resumes. Just like the
 * main flow, a subflow is also composed of one or more policies.
 *
 * In addition to main flow and subflows, the error handlers are also a series
 * of policies to take care of errors. Both of the policy and flow can define an
 * error handler. - A policy defines its own error handler to fix the problem in
 * this policy and its subflow (if there is one). When errors happen, the policy
 * error handler is invoked. After the policy error handler finishes, the flow
 * to which the policy at fault belongs can resume. - A flow may define its own
 * error handler to fix the problem in it. For example, the main flow may have a
 * global error handler, or a subflow may have its own error handler. When a
 * flow goes wrong, its error handler is invoked. After the error handler
 * finishes, the issue is considered as recovered and the flow is considered as
 * finished - the remaining policies will not be executed. (A custom policy may
 * invoke a subflow with its own error handler via the invokeFlow call. As for
 * the built-in policies, they usually invoke a subflow without one, but users
 * may choose to define a policy error handler.)
 *
 * If a flow ends with kAbort, the error object will be passed to the flow's
 * middleware callback. So the next error middleware can examine the error
 * object.
 *
 * TODO: add a section about how the response is written in the flow ** enum of
 * the flow type: - kMain: the main flow - kSubflow: a subflow invoked by other
 * policies - kPolicyErrorHandler: an error handler that is defined to handle
 * the errors inside a policy - kFlowErrorHandler: an error handler that is
 * defined to handle the errors inside a flow - kGlobalHandler: the global error
 * handler, invoked when the error in the main flow is unrecoverable.
 */
var kMain = 0;
var kSubflow = 1;
var kPolicyErrorHandler = 2;
var kFlowErrorHandler = 3;
var kGlobalHandler = 4;

/**
 * load the built-in tasks here. these built-in tasks are the very basic ones.
 * however, some may be moved to micro-gw later
 */
var builtInTasks = {
  if: require('./task/if')(),
  throw: require('./task/throw')(),
  'operation-switch': require('./task/operation-switch')(),
  invoke: require('./task/invoke')(),
};

/**
 * FlowStackObj is an internal object that is saved onto the flow stack.
 *
 * @param id
 *          The flow id
 * @param flow
 *          The assembly, including a serial of policies
 * @param flowType
 *          The flow type (kMain, kSubflow, ..., etc)
 * @param options
 *          Used to specify the custom task function and paramResolver.
 * @param parent
 *          The parent flow (a FlowStackObj), if the task function or
 *          paramResolver in current object doesn't present, look it up in the
 *          parent.options
 * @param resume
 *          The callback invoked to resume the calling policy of a subflow
 * @param catch
 *          A subflow may have an optional error handler, and this optional
 *          error handler is saved in
 * @catch.
 */
function FlowStackObj(id, flow, type, options, parent, resume) {
  assert(parent || type === kMain);
  assert(!resume || type === kSubflow || type === kFlowErrorHandler);

  this.id = id;
  this.flow = flow;
  this.flowType = type;
  this.options = options || {};
  this.parent = parent;
  this.resume = resume;
  // the task pointer begins with zero
  this.taskIndex = 0;
}

FlowStackObj.prototype.getTaskFunc = function(taskName) {
  var rev;
  if (this.options.tasks && this.options.tasks[taskName]) {
    rev = this.options.tasks[taskName];
  } else if (this.parent) {
    rev = this.parent.getTaskFunc(taskName);
  }
  return rev;
};

FlowStackObj.prototype.getParamResolver = function() {
  var rev;
  if (this.options.paramResolver) {
    rev = this.options.paramResolver;
  } else if (this.parent) {
    rev = this.parent.getParamResolver();
  }
  return rev;
};

/**
 * Ctor function of Flow
 *
 * @param config
 *          the flow (or the assembly) to be executed
 * @param options
 *          the parameters, including: - paramResolver: the parameter resolver -
 *          basedir: the working directory, for loading the other files. -
 *          tasks: the custom policies to be executed
 */
function Flow(config, options) {
  if (!(this instanceof Flow)) {
    return new Flow(config, options);
  }

  if (!config) {
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
  // to keep the flow error
  this._error = undefined;
  this._next = undefined;
  this._context = undefined;
  this._tid = options.tid || tid();
  this.logger = options.logger ||
    gLogger.child(
      {
        tid: this._tid,
        level: options.logLevel || 'info',
        loc: 'flow-engine',
      });

  this._options = options;
  // initialize the custom policy if needed
  this._options.tasks = options.tasks || {};
}
// inherit subscribe, unsubscribe and clearSubscribe
util.inherits(Flow, Observable);

/**
 * Setup the flow, ex: save the context object.
 */
Flow.prototype.prepare = function(ctx, next) {
  this.logger.debug('Preparing the flow');
  this._next = next;
  this._context = ctx;
  var _this = this;

  // use this object to store all of the flow-engine APIs for a policy
  // avoid of using bind for bad performance.
  var flow = {};

  Object.defineProperties(flow, {
    /*
     * invoke() a policy could use this to execute a sub-flow
     */
    invoke: {
      value: function(assembly, options, next) {
        invokeFlow.call(_this, assembly, options, next);
      },
      writable: false,
      enumerable: true,
      configurable: false },
    /*
     * subscribe() a policy could subscribe a special event
     */
    subscribe: {
      value: function(event, listener) {
        _this.subscribe(event, listener);
      },
      writable: false,
      enumerable: true,
      configurable: false },
    /*
     * unsubscribe() a policy could unsubscribe a special event
     */
    unsubscribe: {
      value: function(event, listener) {
        _this.unsubscribe(event, listener);
      },
      writable: false,
      enumerable: true,
      configurable: false },
  });

  flow.logger = this.logger;
  this._flow = flow;
};

/**
 * start to excute the flow
 */
Flow.prototype.run = function() {
  var _this = this;
  this.logger.debug('event: START');

  // done callback for the notify()
  function startEventDone(error) {
    if (error) {
      _this.logger.error(
          'Error in START event done: %s', error);
    }
    _this.logger.debug('Running the flow');
    _this._evaluateState();
  }

  Observable.notify.call(
    _this, 'START',
    'START', // event name as context
    function(error, next) { // intermittent callback
      if (error) {
        _this.logger.error('Error in START event handler: %s',
          error);
      }
      next(); // ignore
    },
    startEventDone);
};

/**
 * check state
 */
Flow.prototype._evaluateState = function() {
  var _this = this;

  switch (this._state) {
    case kInit:
      {
        if (this._main.length === 0) {
          this.logger.error('Found no policy in the assembly. Abort now');

          this._error = {
            name: 'RuntimeError',
            message: 'Found no policy in the assembly.',
          };
          this._state = kAbort;
          this._evaluateState();
          return;
        }

    // prepare the main flow and push it onto stack
        var mainFlow = new FlowStackObj(
      this._flowID++, this._main, kMain, this._options);

    // The global error handler is an error handler for the main flows
    // Associate the global error handler with the main flow here.
        mainFlow.catch = this._globalErrorHandler;

        this.logger.debug('Executing assembly with flow id "%d"', mainFlow.id);
        this._flowStack.push(mainFlow);
        this._state = kRunning;
      }
  /* falls through */
    case kRunning:
      {
    // prepare the next task
        process.nextTick(function() {
          _this._prepareNextTask();
        });
        break;
      }
    case kPrepareOutput:
      {
    // In the pure javascript flow engine, it is the task not the flow
    // engine
    // to decide what to be written to response. For now, nothing is done in
    // the kPrepareOutput state.

    // We are done here
        this._state = kDone;
        process.nextTick(function() {
          _this._evaluateState();
        });
        break;
      }
    case kDone:
      this.logger.debug('The flow is completed.');

    // Notify the FINISH event first. Then continue with the next
    // middleware.
      this.logger.debug('event: FINISH');
      Observable.notify.call(_this, 'FINISH',
        'FINISH', // event name as context
        function(error, next) { // intermittent callback
          if (error) {
            _this.logger.error('Error in FINISH event handler: %s',
                error);
          }
          next(); // ignore
        },
        function(error) { // done callback
          if (error) {
            _this.logger.error('Error in FINISH event done: %s',
                error);
          }
          process.nextTick(function() {
            _this._next();
          });
        });
      break;
    case kAbort:
      this.logger.debug('The flow is aborted.');

      if (!this._error) {
        this.logger.warn('Unknown error? The abort reason is undefined.');
        this._error = {
          name: 'RuntimeError',
          message: 'The abort reason is undefined. Could be a bug',
        };
      }

    // Notify the ERROR event first. After the ERROR event is done, continue
    // with next error middleware in the done callback.
      this.logger.debug('event: ERROR');
      Observable.notify.call(_this, 'ERROR',
        'ERROR', // event name as context
        function(error, next) { // intermittent callback
          if (error) {
            _this.logger.error('Error in ERROR event handler: %s',
                error);
          }
          next(); // ignore
        },
        function(error) { // done callback
          if (error) {
            _this.logger.error('Error in ERROR event handler: %s',
                error);
          }
          process.nextTick(function() {
            _this._next(_this._error);
          });
        });
      break;
    default:
      this.logger.error('Invalid state. Could be a bug');
      this._error = {
        name: 'RuntimeError',
        message: 'Invalid state. Could be a bug',
      };

      process.nextTick(function() {
        _this._next(_this._error);
      });
      break;
  }
};

/**
 * Create the third param of policy handler interface
 *
 * @param flow
 *          the flow-engine instance itself
 * @param task
 *          the running task
 * @param taskType
 *          the running task's type, aka policy name
 */
function createFlowObj(flow, task, taskType) {
  var rev = Object.create(flow._flow);

  var called = false;
  var logger = flow.logger.child(
    { loc: flow.logger.fields.loc + ':policies:' + taskType });

  rev.fail = function(error) {
    if (called) {
      logger.warn(
          'call .fail()/.proceed()/.stop() more then once in policy "%s"',
          taskType);
    } else {
      taskFail.call(flow, task, error);
      called = true;
    }
  };

  rev.proceed = function() {
    if (called) {
      logger.warn(
          'call .fail()/.proceed()/.stop() more then once in policy "%s"',
          taskType);
    } else {
      taskDone.call(flow, task, false);
      called = true;
    }
  };

  rev.stop = function() {
    if (called) {
      logger.warn(
          'call .fail()/.proceed()/.stop() more then once in policy "%s"',
          taskType);
    } else {
      taskDone.call(flow, task, true);
      called = true;
    }
  };

  rev.logger = logger;
  return rev;
}

/**
 * prepare and execute the next task
 */
Flow.prototype._prepareNextTask = function() {
  var current = this._flowStack[this._flowStack.length - 1];
  var task = current.flow[current.taskIndex];
  var _this = this;

  if (task) {
    var taskType = Object.getOwnPropertyNames(task)[0];
    this.logger.debug('loading the policy "%s" (id=%d, index=%d)',
        taskType, current.id, current.taskIndex);

    var flowAPIs = createFlowObj(_this, task, taskType);

    try {

      // initiate the task
      // get task handler, the sequence is
      // 1. use the passing in task handler first
      // 2. built-in tasks
      // 3. require and new handler from ./task
      // 4. require and new handler via require()
      // when you go to #3 or #4, the performance would be bad
      var taskHandler = current.getTaskFunc(taskType) ||
                          builtInTasks[taskType];
      if (!taskHandler) {
        var taskModule;
        // TODO: remove this, should not call factory function
        // per request
        try {
          taskModule = require('./task/' + taskType);
        } catch (err) {
          taskModule = require(taskType);
        }
        // passing empty cfg for now
        taskHandler = taskModule({});
      }

      // do param resolving after we got task handler
      // TODO: we need task-level paramResolver config here
      var paramResolver = taskHandler.skipParamResolving === true ?
          undefined : current.getParamResolver();
      var taskProps = this._resolveTaskParam(paramResolver, task[taskType]);

      // done callback for pre:task
      var ev = 'pre:' + taskType;
      var preEventDone = function(error) {
        if (error) {
          _this.logger.error('Error in %s event done: %s', ev, error);
        }

        // execute the task now
        taskHandler(taskProps, _this._context, flowAPIs);
      };
      this.logger.debug('event: %s', ev);
      Observable.notify.call(_this, ev,
          ev, // event name
          function(error, next) { // intermittent callback
            if (error) {
              _this.logger.error('Error in %s event handler: %s',
                  ev, error);
            }
            next(); // ignore erorr;
          },
          preEventDone);
    } catch (e) {
      this.logger.error('Exception with loading policy "%s" (id=%d, ' +
          'index=%d): %s', taskType, current.id,
          current.taskIndex, e);

      // end the task here by calling taskNext(e)
      flowAPIs.fail(e);
    }
  } else if (this._flowStack.length === 1) {
    // The last flow on the stack has finished
    this.logger.debug('All flows on the stack have been executed.');

    var lastOne = this._flowStack.pop();
    assert(lastOne.flowType === kMain ||
       lastOne.flowType === kGlobalHandler,
       !'The bottom flow is either the main or global handler');

    this._state = kPrepareOutput;
    this._evaluateState();
  } else {
    // This flow is completed. Continue with remaining flows on the
    // stack
    var finished = this._flowStack.pop();
    var nextf = this._flowStack[this._flowStack.length - 1];

    if (finished.resume) {
      if (finished.flowType === kSubflow) {
        this.logger.debug('The current subflow (id=%d) is done. ' +
            'Continue with the calling policy (id=%d, index=%d).',
            finished.id, nextf.id, nextf.taskIndex);
      } else if (finished.flowType === kFlowErrorHandler) {
        this.logger.debug('The flow error handler (id=%d) is done.' +
            ' Continue with the calling policy (id=%d, ' +
            'index=%d).', finished.id, nextf.id, nextf.taskIndex);
      } else {
        assert(!'Bug?! No other flowType can resume a subflow.');
      }

      // Continue with the calling policy
      finished.resume();
    } else {
      assert(finished.flowType === kPolicyErrorHandler);

      this.logger.debug('The policy error handler has recovered the ' +
          'error. Resume the remaining flow (id=%d)', nextf.id);

      // The policy error handler successfully finished, so we can
      // consider the bad task is recovered. It's time to move forward
      nextf.taskIndex++;
      this._evaluateState();
    }
  }
};

function isPrimitive(val) {
  return val === null || (typeof val !== 'object' && typeof val !== 'function');
}
/**
 * If user provides a custom task param resolve function, use it to resolve the
 * parameter value.
 */
Flow.prototype._resolveTaskParam = function(paramResolver, taskCfg) {
  if (taskCfg === undefined) {
    return undefined;
  }

  if (paramResolver === undefined) {
    // no custom task parameters resolver provided, simply return
    return taskCfg;
  }

  if (Array.isArray(taskCfg)) {
    var thisFlow = this;
    return taskCfg.map(function(value, key) {
      return isPrimitive(value) ?
          paramResolver(thisFlow._context, key, value) :
          thisFlow._resolveTaskParam(paramResolver, value);
    });
  }

  var result = {};
  for (var key in taskCfg) {
    if (taskCfg.hasOwnProperty(key)) {
      var value = taskCfg[key];
      // TODO: resolving all of the descending properties may cause issues
      // skip the 'execute' and 'catch' property for now
      // might need to move the following logics into paramResolver
      if (key === 'execute' || key === 'catch') {
        result[key] = value;
      } else {
        // If the value is an object, resolve its descending properties.
        result[key] = isPrimitive(value) ?
            paramResolver(this._context, key, value) :
              this._resolveTaskParam(paramResolver, value);
      }
    }
  }

  return result;
};


// //////////////////////////////////////////////////////////////////////////////
// The error handling
// //////////////////////////////////////////////////////////////////////////////
/*
 * Say we have the main flow and the subflows S1 and S2 on the stacks. In this
 * example, the both policies (C1 and C2) that invoke the subflows (S1 and S2)
 * specify their error handlers, L0 and L2 to take care of errors. L2 can deal
 * with the specific error 'a', 'b', and 'c', while L2 can deal with any errors.
 * In addition, the main flow and the subflow S1 got their own error handlers,
 * GEH and L1 to fix any errors at the flow-level. (The * is used to indicate a
 * match-all, or the default case)
 *
 * L0<*> Main w/GEH<*>: [t1]--[C1]--[t2]--> | | L2<a,b,c> S1/L1<*>
 * +-[t3]--[C2]--[t4]--> | S2 +-[t5]--[x]--[t6]--> error=? ** case 1: flow error
 * handler When an error 'z' is thrown from the second policy of S2, L2 can't
 * handle the error while the flow's error handler L1 can. So the subflows, S2
 * and S1, are removed from the stack (or aborted) and L1 is pushed onto stack.
 * L1 now is invoked to handle the error 'a'.
 *
 * L0<*> Main w/GEH<*>: [t1]--[C1]--[t2]--> | | L1_*: +-[t7]--[x]--[t8]-->
 * error=?
 *
 * What if another error is thrown from the L1? First, we need to check whether
 * the policy itself can handle the error or not. If not, pop L1 first, and then
 * try L0. If L0 cannot deal with the error either, pop the main and push the
 * GEH. ** case 2: policy error handler When an error 'b' is thrown from S2, The
 * policy error handler of C2, 'L2', is invoked to handle errors. So S2 is
 * popped and L2 is pushed.
 *
 * L0<*> Main w/GEH<*>: [t1]--[C1]--[t2]--> | | L2<a,b,c> S1/L1<*>
 * +-[t3]--[C2]--[t4]--> | L2_b: +-[t9]--[x]--[t10]--> error=b
 *
 * What if the error 'b' is re-thrown from the L2_b? First we need to check
 * whether the policy itself can handle the error or not. If not, pop L2_b. Then
 * we check L1 instead of L2 here. Why skip L2? Because the L2 has already
 * invoked and failed. So it is time check the L1. If L1 can handle the error,
 * pop S1 and push L1. Otherwise, check L0 and then GEH. If L2 is not skipped,
 * it becomes an infinite loop here.
 *
 */

// This is a callback that will be passed to tasks. When a task finishes, it
// should invoke this callback to return control to the Flow.
//
// The arguments[0] has been bound to the task by the Flow.
function taskDone(task, stop) {
  /* jshint validthis: true */
  var that = this;
  var currFlow = that._flowStack[that._flowStack.length - 1];
  var taskType = Object.getOwnPropertyNames(task)[0];
  currFlow.taskIndex++;

  // done callback for the post:Task event
  var ev = 'post:' + taskType;
  var postEventDone = function(error) {
    if (error) {
      that.logger.error('Error in %s event done: %s', ev, error);
    }
    if (stop) {
      that._state = kPrepareOutput;
    }
    that._evaluateState();
  };
  // post event is only triggered when task finishes without any error
  // and the error in the event handlers are ignored
  this.logger.debug('event: %s', ev);
  Observable.notify.call(that, ev,
      ev, // event name
      function(error, next) { // intermittent callback
        if (error) {
          that.logger.error('Error in %s event handler: %s',
              ev, error);
        }
        next(); // ignore
      },
      postEventDone);
}
  // The arguments[0] has been bound to the task by the Flow. So tasks should
  // just
  // call fail(error) to transfer control to Flow.
function taskFail(task, error) {
  /* jshint validthis: true */
  var that = this;

  that.logger.error('The policy "%s" returned with an error: %j',
      Object.getOwnPropertyNames(task)[0], error);

  // Oops. update the context.error
  that._context.error = error;


  // Now, look for the error handler in the stack. The rules are:
  // 1. we check if the current policy got its own error handler.
  // 2. we check if the current flow got the error handler itself.
  // If both of 1 and 2 fail, pop the topmost flow out of stack.
  var handler;
  var newFlow;
  var currFlow;
  while (that._flowStack.length > 0) {
    currFlow = that._flowStack[that._flowStack.length - 1];
    var currTask = currFlow.flow[currFlow.taskIndex];
    var type = Object.getOwnPropertyNames(currTask)[0];

    // 1. check the policy's own handler
    if (currTask[type].catch) {
      that.logger.debug('Looking for error handler in the policy ' +
          '"%s" (id=%d, index=%d)', type, currFlow.id,
          currFlow.taskIndex);

      handler = that.findMatchingErrorHandler(currTask[type].catch);

      // Found the handler. Push the handler flow onto the stack. When
      // the handler is done, the current flow will be resumed.
      if (handler) {
        newFlow = new FlowStackObj(that._flowID++,
            handler, kPolicyErrorHandler, {}, currFlow);
        that._flowStack.push(newFlow);

        that.logger.debug('Found the error handler in policy "%s" ' +
            '(id=%d, index=%d). Invoke it with flow id "%d"',
            type, currFlow.id, currFlow.taskIndex, newFlow.id);

        // Prevent any further error to be caught by the same handler
        delete currTask[type].catch;
        break;
      }
    }

    // 2. check the flow's own handler
    // Some flows might got their own error handlers. For example, the
    // main flow which can have the global error handler, or the
    // subflows that are added to stack via the invokeFlow call.
    if (currFlow.catch) {
      if (currFlow.flowType === kMain) {
        that.logger.debug('Looking for the global error handler');
      } else {
        that.logger.debug('Looking for error handler of the ' +
            'subflow (id=%d)', currFlow.id);
      }

      handler = that.findMatchingErrorHandler(currFlow.catch);

      if (handler) {
        // Give up this subflow and invoke its error handler
        var f0 = that._flowStack.pop();

        if (currFlow.flowType === kMain) {
          newFlow = new FlowStackObj(that._flowID++,
              handler, kGlobalHandler, {}, f0);

          that.logger.debug('The main flow aborted. Invoke the ' +
              'global error handler with id "%d" now.',
              newFlow.id);
        } else {
          // The handler must inherit the subflow's resume callback
          // So that the originator of subflow can continue later
          newFlow = new FlowStackObj(that._flowID++, handler,
              kFlowErrorHandler, {}, f0, f0.resume);

          that.logger.debug('The subflow (id=%d) aborted. Invoke' +
              ' its error handler with id "%d" now.',
              f0.id, newFlow.id);
        }
        that._flowStack.push(newFlow);

        break;
      }
    }

    // Cannot find the error handler in the topmost flow. Pop it.
    assert(currFlow === that._flowStack.pop());

    if (currFlow.flowType === kPolicyErrorHandler) {
      that.logger.debug('The policy error handler (id=%d) cannot' +
          ' deal with the error. Abort now.', currFlow.id);
    } else if (currFlow.flowType === kFlowErrorHandler) {
      that.logger.debug('The flow error handler (id=%d) cannot' +
          ' deal with the error. Abort now.', currFlow.id);
    } else {
      that.logger.debug('The flow (id=%d) cannot deal with the error' +
          '. Abort now.', currFlow.id);
    }
  }

  if (!handler) {
    assert(that._flowStack.length === 0);

    that._error = that._context.error;
    that._state = kAbort;
  }

  that._evaluateState();
}

Flow.prototype.findMatchingErrorHandler = function(catchClause) {
  if (!catchClause) {
    return undefined;
  }

  for (var i in catchClause) {
    var theCase = catchClause[i];
    // a case must have either the 'errors' or 'default' property
    if (theCase.errors) {
      for (var j in theCase.errors) {
        var text = theCase.errors[j];
        var real = this._context.error;

        // errors returned by policies are supposed to be ojects, ex:
        // { name: ..., message: ... }
        if (real && real.name) {
          if (real.name === text) {
            this.logger.debug('The case "%s" is matched', text);
            return theCase.execute;
          }
        } else if (typeof real === 'string' && real === text) {
          // just in case some policies don't return errors in objects
          this.logger.debug('The case "%s" is matched', text);
          return theCase.execute;
        }

        this.logger.debug('The case "%s" is not matched', text);
      }
    } else if (theCase.default) {
      this.logger.debug('Use the default case');
      return theCase.default;
    } else {
      this.logger.warn('An invalid case %j? Got to skip it. ', theCase);
    }
  }
};

/**
 * A policy can invoke a subflow via this function. For example, the built-in
 * policy 'operation-switch'. Users can write a custom policy to invoke a
 * subflow too. If the custom policy would like to provide a flow-level error
 * handler, they can provide an assembly in a JSON object like this: { execute:
 * <the subflow>, catch: <error handler> }
 *
 * @param assembly
 *          is a JSON object. Check the above example.
 * @param next
 *          a callback to notify the parent policy that the subflow is done.
 * @param options
 *          a custom param resolver for example.
 */
function invokeFlow(assembly, options, next) {
  if (options instanceof Function) {
    next = options;
    options = {};
  }
  // check the validness of the assembly and callback
  assert(assembly && assembly.execute && (next instanceof Function),
      'Invalid invocation of a subflow.');

  /* jshint validthis: true */
  var that = this;

  var stackTop = that._flowStack[that._flowStack.length - 1];
  var caller = stackTop.flow[stackTop.taskIndex];
  var taskType = Object.getOwnPropertyNames(caller)[0];

  var newFlowID = that._flowID++;
  that.logger.debug('A subflow is invoked with id "%s" by the "%s" policy',
      newFlowID, taskType);

  // create the subflow, and save its own error handler if any.
  var subflow = new FlowStackObj(
      newFlowID, assembly.execute, kSubflow, options, stackTop, next);
  if (assembly.catch) {
    subflow.catch = assembly.catch;
  }

  // push the subflow onto the stack
  that._flowStack.push(subflow);

  process.nextTick(function() {
    that._prepareNextTask();
  });
}

exports.Flow = Flow;
exports._gLogger = gLogger;
exports.tid = tid;
