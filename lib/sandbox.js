'use strict';
var vm = require('vm');

var Sandbox = function() {
    this._ = {};
    vm.createContext(this._);
};

Sandbox.prototype.runInContext = function(text, context) {
    try {
        //compile the expression
        var script = new vm.Script(text);

        //prepare the sandbox by cloning the context
        _clone(this._, context);

        //execute
        return script.runInContext(this._);
    }
    finally {
        //reset the sandbox for the re-use
        _cleanup(this._);
    }
};

//our own version of _.clone() which only take care of non-function properties
function _clone(sandbox, context) {
    var names = Object.getOwnPropertyNames(context);
    names.forEach(function(name) {
        var val = context[name];
        if (!(val instanceof Function)) {
            sandbox[name] = val;
        }
    });
}

//remove all properties from sandbox
function _cleanup(sandbox) {
    var newProps = Object.getOwnPropertyNames(sandbox);
    newProps.forEach(function(name) {
        delete sandbox[name];
    });
}

//a shared contextified sandbox
var _sandbox = new Sandbox();

// Run the text in the context of the shared sandbox
exports.runInContext = function(text, context) {
    return _sandbox.runInContext(text, context);
};

// Create a sandbox that can be used to runInContext
exports.createSandbox = function() {
    return new Sandbox();
};
