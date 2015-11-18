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
 * 
 * i.e.:
 *     ctx.set('task.name', 'mytask');
 *     //ctx.fool.task.name is created and its value is 'mytask'
 */
function Context(namespace) {
    if (!(this instanceof Context)) {
        return new Context(namespace);
    }
    assert(util.isString(namespace) && namespace.length > 0, 'namespace shall be a string');
    //Note: namespace could not be 'set' or 'get'
    this[namespace] = {};
    this.set = bindSetter(setter, this, namespace);
    this.get = bindGetter(getter, this, namespace);
}

/**
 * bind setter, closure + .call() is way faster then bind() + apply()
 */
function bindSetter(setter, thisObj, ns) {
    return function (name, value) {
        return setter.call(thisObj, ns, name, value);
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

function setter(ns, name, value) {
    var ctxNames = name.split('.');
    var currentNode = this[ns];
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
    currentNode[lastNode] = value;
}

function getter(ns, name) {
    var ctxNames = name.split('.');
    var currentNode = this[ns];
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