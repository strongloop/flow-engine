'use strict';
const util      = require("util");
const assert    = require('assert');

/**
 * Context ctor, create a context object with the given namespace
 * it will create the namespace node and attaches to the context itself immediately.
 * like: 
 *     var ctx = new Context('fool');
 *     ctx.fool.bar = 'test'; //ctx.fool is created automatically
 * 
 * and its getter/setter methods: get() and set() will access the
 * variables under that namespace.
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
 * A context object provides set() and get() functions to access or modify its variables.
 * You can also use dot notation to access all of the variables.
 * - set(name, value [,readOnly])
 *   set variable with the specified name and value. you can also specify the third
 *   argument as 'true' to make the new property as read-only
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
    assert(!namespace || (util.isString(namespace) && namespace.length > 0), 'namespace shall be a string');
    if ( namespace ) {
        Object.defineProperty(this, namespace, 
                { value: {}, 
                  writable: false,
                  enumerable: true,
                  configurable: false } );
    }
    Object.defineProperty(this, 'set', 
            { value: bindSetter(setter, this, namespace), 
              writable: false,
              enumerable: false,
              configurable: false } );
    Object.defineProperty(this, 'get', 
            { value: bindGetter(getter, this, namespace), 
              writable: false,
              enumerable: false,
              configurable: false } );
}

/**
 * bind setter, closure + .call() is way faster then bind() + apply()
 */
function bindSetter(setter, thisObj, ns) {
    return function (name, value, readOnly) {
        return setter.call(thisObj, ns, name, value, readOnly);
    }
}

/**
 * bind getter, closure + .call() is faster then bind() + apply()
 */
function bindGetter(func, thisObj, ns) {
    return function (name) {
        return func.call(thisObj, ns, name);
    }
}

function setter(ns, name, value, readOnly) {
    readOnly = readOnly || false;
    var ctxNames = name.split('.');
    var currentNode = ns ? this[ns] : this;
    var lastNode = ctxNames.pop();
    if ( ctxNames.length > 0) {
        for(let index = 0; index < ctxNames.length; index++) {
            let ctxName = ctxNames[index];
            let node = currentNode[ctxName];
            if ( !node ) {
                node = {};
                currentNode[ctxName] = node;
            } 
            currentNode = node;
        }
    }
    Object.defineProperty(currentNode, lastNode, 
            { 'value': value, 
              writable: !readOnly,
              enumerable: true,
              configurable: !readOnly } );
}

function getter(ns, name) {
    var ctxNames = name.split('.');
    var currentNode = ns ? this[ns] : this;
    var lastNode = ctxNames.pop();
    if ( ctxNames.length > 0) {
        for(let index = 0; index < ctxNames.length; index++) {
            let ctxName = ctxNames[index];
            let node = currentNode[ctxName];
            if ( !node ) {
                return undefined;
            } 
            currentNode = node;
        }
    }
    return currentNode[lastNode];   
}

exports.createContext = function (namespace) {
    return new Context(namespace);
}