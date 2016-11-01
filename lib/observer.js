// Copyright (c) IBM Corp. 2016. All Rights Reserved.
// Node module: flow-engine
// This project is licensed under the MIT License, see LICENSE.txt

/*eslint-env node es5*/
'use strict';
var async = require('async');

/*
 * clone this file from:
 * https://github.com/strongloop/loopback-datasource-juggler and change it to
 * use prototype, then it can be util.inherit()
 */

function createPromiseCallback() {
  var cb;
  var promise = new Promise(function(resolve, reject) {
    cb = function(err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    };
  });
  cb.promise = promise;
  return cb;
}

module.exports = Observable;

/**
 * Observable class and could be util.inherit()
 *
 * @class Observable
 */
function Observable() {
}

/**
 * Register an asynchronous observer for the given operation (event).
 *
 * @param {String}
 *            operation The operation name.
 * @callback {function} listener The listener function. It will be invoked with
 *           `this` set to the model constructor, e.g. `User`.
 * @param {Object}
 *            context Operation-specific context.
 * @param {function(Error=)}
 *            next The callback to call when the observer has finished.
 * @end
 */
Observable.prototype.subscribe = function(operation, listener) {
  if (typeof listener !== 'function') {
    return;
  }
  this._observers = this._observers || {};
  if (!this._observers[operation]) {
    this._observers[operation] = [];
  }

  if (this._observers[operation].indexOf(listener) === -1) {
    this._observers[operation].push(listener);
  }
};

/**
 * Unregister an asynchronous observer for the given operation (event).
 *
 * @param {String}
 *            operation The operation name.
 * @callback {function} listener The listener function.
 * @end
 */
Observable.prototype.unsubscribe = function(operation, listener) {
  if (!(this._observers && this._observers[operation])) {
    return;
  }

  var index = this._observers[operation].indexOf(listener);
  if (index !== -1) {
    return this._observers[operation].splice(index, 1);
  }
};

/**
 * Unregister all asynchronous observers for the given operation (event).
 *
 * @param {String}
 *            operation The operation name.
 * @end
 */
Observable.prototype.clearSubscribe = function(operation) {
  if (!(this._observers && this._observers[operation])) {
    return;
  }

  this._observers[operation].length = 0;
};

/**
 * Static function. Invoke all async observers for the given operation(s).
 *
 * @param {String|String[]}
 *            operation The operation name(s).
 * @param {Object}
 *            context Operation-specific context.
 * @param {function(Error=)}
 *            intermittent The callback to call when a single observer
 *            has finished.
 * @param {function(Error=)}
 *            callback The callback to call when all observers has finished.
 */
Observable.notify = function(operation, context, intermittent, callback) {
  var self = this;

  if (!callback) {
    callback = createPromiseCallback();
  }

  function createNotifier(op) {
    return function(ctx, done) {
      if (typeof ctx === 'function' && done === undefined) {
        done = ctx;
        ctx = context;
      }
      Observable.notify.call(self, op, context, intermittent, done);
    };
  }

  if (Array.isArray(operation)) {
    var tasks = [];
    for (var i = 0, n = operation.length; i < n; i++) {
      tasks.push(createNotifier(operation[i]));
    }
    return async.waterfall(tasks, callback);
  }

  var observers = this._observers && this._observers[operation];

  async.eachSeries(observers, function notifySingleObserver(fn, next) {
    if (intermittent) {
      try {
        fn(context, function(error) {
          intermittent.call(self, error, next);
        });
      } catch (e) {
        intermittent.call(self, e, next);
      }
    } else {
      try {
        fn(context, next);
      } catch (e) {
        next(e);
      }
    }
  }, function(err) {
    callback(err, context);
  });

  return callback.promise;
};

/**
 * Run the given function with before/after observers. It's done in three serial
 * steps asynchronously:
 *  - Notify the registered observers under 'before ' + operation - Execute the
 * function - Notify the registered observers under 'after ' + operation
 *
 * If an error happens, it fails fast and calls the callback with err.
 *
 * @param {String}
 *            operation The operation name
 * @param {Context}
 *            context The context object
 * @param {Function}
 *            fn The task to be invoked as fn(done) or fn(context, done)
 * @param {Function}
 *            callback The callback function
 * @returns {*}
 */
Observable.notifyAround = function(operation, context, fn, callback) {
  var self = this;
  context = context || {};
  // Add callback to the context object so that an observer can skip other
  // ones by calling the callback function directly and not calling next
  if (context.end === undefined) {
    context.end = callback;
  }
  // First notify before observers
  return self.notify('before ' + operation, context, function(err, context) {
    if (err) {
      return callback(err);
    }

    function cbForWork(err) {
      var args = [].slice.call(arguments, 0);
      if (err) {
        return callback.apply(null, args);
      }
      // Find the list of params from the callback in addition to err
      var returnedArgs = args.slice(1);
      // Set up the array of results
      context.results = returnedArgs;
      // Notify after observers
      self.notify('after ' + operation, context, function(err, context) {
        if (err) {
          return callback(err, context);
        }
        var results = returnedArgs;
        if (context && Array.isArray(context.results)) {
          // Pickup the results from context
          results = context.results;
        }
        // Build the list of params for final callback
        var notifyArgs = [ err ].concat(results);
        callback.apply(null, notifyArgs);
      });
    }

    if (fn.length === 1) {
      // fn(done)
      fn(cbForWork);
    } else {
      // fn(context, done)
      fn(context, cbForWork);
    }
  });
};
