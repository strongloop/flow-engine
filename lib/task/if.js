'use strict';
var vm = require('vm');

module.exports = function (config) {

    //a shared contextified sandbox
    var sandbox = {};
    vm.createContext(sandbox);

    return function (props, context, flow) {
        var logger  = flow.logger;


        function resume() {
            logger.debug('[if] resume now.');
            flow.proceed();
        }

        var text = props.condition;
        logger.debug('[if] evaluating the condition: %s', text);

        var result;
        try {
            var script = new vm.Script(text);
            //clone properties of context
            clone(sandbox, context);
            result = script.runInContext(sandbox);
        }
        catch (e) {
            logger.error('[if] failed to evaluate the condition: %s', e);

            var error = {
                'name': 'RuntimeError',
                'message': e.toString()
            };
            flow.fail(error);
            return;
        }
        finally {
            //clean up
            cleanup(sandbox);
        }

        // evaluate the condition and execute tasks
        if (result) {
            logger.debug('[if] invoke the subflow: %j', props.execute);

            flow.invoke({execute: props.execute}, resume);
        }
        else {
            logger.debug('[if] skip the subflow: %j', props.execute);

            flow.proceed();
        }
    };
};

//our own version of _.clone() which only take care of non-function properties
function clone(target, source) {
    var names = Object.getOwnPropertyNames(source);
    names.forEach(function(name) {
        var val = source[name];
        if (!(val instanceof Function)) {
            target[name] = val;
        }
    });
}

//remove all properties
function cleanup(target) {
    var newProps = Object.getOwnPropertyNames(target);
    newProps.forEach(function(name) {
        delete target[name];
    });
}