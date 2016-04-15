'use strict';
var vm = require('vm');

//a shared contextified sandbox
var _sandbox = {};
vm.createContext(_sandbox);

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

//run the text in the context
exports.runInContext = function(text, context) {
    try {
        //compile the expression
        var script = new vm.Script(text);

        //prepare the sandbox by cloning the context
        _clone(_sandbox, context);

        //execute
        return script.runInContext(_sandbox);
    }
    finally {
        //reset the sandbox for the re-use
        _cleanup(_sandbox);
    }
}
