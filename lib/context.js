// © Copyright IBM Corporation 2015,2017.
// Node module: flow-engine
// LICENSE: Apache 2.0, https://www.apache.org/licenses/LICENSE-2.0


/*eslint-env node */
'use strict';
var util = require('util');
var assert = require('assert');
var Observable = require('./observer');

/**
 * Context creates a context object with the given namespace. It will create the
 * namespace node and attaches to the context itself immediately.
 * like:
 *     var ctx = new Context('fool');
 *     ctx.fool.bar = 'test'; //ctx.fool is created automatically
 *
 * and its getter/setter methods: get() and set() will access the variables
 * under that namespace.
 * i.e.:
 *     ctx.set('task.name', 'mytask');
 *     //ctx.fool.task.name is created and its value is 'mytask'
 *
 * if no namespace presents, then the variables will be directly attached to the
 * context object itself.
 *     var ctx = new Context();
 *     ctx.set('fool', 'bar');
 *     //ctx.fool === 'bar'
 *
 * A context object provides set() and get() functions to access or modify its
 * variables. You can also use dot notation to access all of the variables.
 * - set(name, value [,readOnly])
 *   set variable with the specified name and value. you can also specify the
 *   third argument as 'true' to make the new property as read-only
 *
 * - get(name)
 *   get variable with the specified name.
 *
 * - use dot notation to access the variables under the context object.
 */
function Context(namespace) {
  if (!(this instanceof Context)) {
    return new Context(namespace);
  }

  assert(!namespace || (typeof namespace === 'string' && namespace.length > 0),
      'namespace shall be a string');

  if (namespace) {
    Object.defineProperty(this, namespace, {
      value: {},
      writable: false,
      enumerable: true,
      configurable: false,
    });
  }
  Object.defineProperty(this, 'set', {
    value: bindSetter(setter, this, namespace),
    writable: false,
    enumerable: false,
    configurable: false,
  });
  Object.defineProperty(this, 'get', {
    value: bindGetter(getter, this, namespace),
    writable: false,
    enumerable: false,
    configurable: false,
  });
  Object.defineProperty(this, 'define', {
    value: bindDefine(define, this, namespace),
    writable: false,
    enumerable: false,
    configurable: false,
  });
  Object.defineProperty(this, 'del', {
    value: bindDel(del, this, namespace),
    writable: false,
    enumerable: false,
    configurable: false,
  });
}

//inherit subscribe, unsubscribe and clearSubscribe
util.inherits(Context, Observable);

/**
 * fire a specific event. after all subscribers are notified,
 * the done cb will be called and pass the errors in if
 * there are.
 */
Context.prototype.notify = function(event, done) {
  var _this = this;
  var errors = [];
  Observable.notify.call(_this, event, event, //event name as context
  function(error, next) { //intermittent callback
    if (error) {
      //ignore error
      errors.push(error);
    }
    next(); //ignore
  }, function(error) { //done callback
    if (error) {
      errors.push(error);
    }
    if (done) {
      process.nextTick(function() {
        done(errors.length ? errors : undefined);
      });
    }
  });
};

/**
 * bind setter, closure + .call() is way faster then bind() + apply()
 */
function bindSetter(setter, thisObj, ns) {
  return function(name, value, readOnly) {
    return setter.call(thisObj, ns, name, value, readOnly);
  };
}

/**
 * bind getter, closure + .call() is faster then bind() + apply()
 */
function bindGetter(func, thisObj, ns) {
  return function(name) {
    return func.call(thisObj, ns, name);
  };
}

function bindDefine(func, thisObj, ns) {
  return function(name, getter, setter, configurable) {
    return func.call(thisObj, ns, name, getter, setter, configurable);
  };
}

function bindDel(func, thisObj, ns) {
  return function(name) {
    return func.call(thisObj, ns, name);
  };
}

function setter(ns, name, value, readOnly) {
  assert(typeof name === 'string', 'name shall be a string');
  readOnly = readOnly || false;
  var ctxNames = name.split('.');
  /*jshint validthis: true */
  var currentNode = ns ? this[ns] : this;
  var lastNode = ctxNames.pop();
  if (ctxNames.length > 0) {
    for (var index = 0; index < ctxNames.length; index++) {
      var ctxName = ctxNames[index];
      var node = currentNode[ctxName];
      if (!node) {
        node = {};
        currentNode[ctxName] = node;
      }
      currentNode = node;
    }
  }
  Object.defineProperty(currentNode, lastNode, {
    value: value,
    writable: !readOnly,
    enumerable: true,
    configurable: !readOnly,
  });
}

function getter(ns, name) {
  assert(typeof name === 'string', 'name shall be a string');
  var ctxNames = name.split('.');
  /*jshint validthis: true */
  var currentNode = ns ? this[ns] : this;
  var lastNode = ctxNames.pop();
  if (ctxNames.length > 0) {
    for (var index = 0; index < ctxNames.length; index++) {
      var ctxName = ctxNames[index];
      var node = currentNode[ctxName];
      if (!node) {
        return undefined;
      }
      currentNode = node;
    }
  }
  return currentNode[lastNode];
}

function del(ns, name) {
  assert(typeof name === 'string', 'name shall be a string');
  var ctxNames = name.split('.');
  /*jshint validthis: true */
  var currentNode = ns ? this[ns] : this;
  var lastNode = ctxNames.pop();
  if (ctxNames.length > 0) {
    for (var index = 0; index < ctxNames.length; index++) {
      var ctxName = ctxNames[index];
      var node = currentNode[ctxName];
      if (!node) {
        return undefined;
      }
      currentNode = node;
    }
  }
  return delete currentNode[lastNode];
}

function define(ns, name, getter, setter, configurable) {
  assert(typeof name === 'string', 'name shall be a string');
  assert(typeof getter === 'function', 'getter shall be a Function');
  //optional
  if (setter === undefined) {
    configurable = true;
  } else if (typeof setter === 'function') {
    configurable = configurable === undefined ? true : !!configurable;
  } else if (typeof setter === 'boolean') {
    configurable = setter;
    setter = undefined;
  } else {
    throw new Error('usage: define( name, getter, [setter, configruable])');
  }
  var ctxNames = name.split('.');
  /*jshint validthis: true */
  var currentNode = ns ? this[ns] : this;
  var lastNode = ctxNames.pop();
  if (ctxNames.length > 0) {
    for (var index = 0; index < ctxNames.length; index++) {
      var ctxName = ctxNames[index];
      var node = currentNode[ctxName];
      if (!node) {
        node = {};
        currentNode[ctxName] = node;
      }
      currentNode = node;
    }
  }
  var descriptor = {
    enumerable: true,
    get: getter,
    configurable: configurable,
  };
  if (setter) {
    descriptor.set = setter;
  }
  Object.defineProperty(currentNode, lastNode, descriptor);
}

exports.createContext = function(namespace) {
  return new Context(namespace);
};
