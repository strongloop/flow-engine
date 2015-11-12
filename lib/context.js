const cls = require('continuation-local-storage');

//namespace for the flowengine
const NS_FLOWENGINE = 'FlowEngine';
const NS_STRONGLOOP = 'loopback';

/**
 * get current context
 * if context doesn't exist, return null
 */
function getCurrentContext() {
    //try to detect if there is an existing context
    if (process.context) {
        if ( process.context[NS_STRONGLOOP]) {
            return process.context[NS_STRONGLOOP];
        } else if (process.context[NS_FLOWENGINE]) {
            return process.context[NS_FLOWENGINE];
        }
    }
    return null;
}

/**
 * create a new context and attach to process.context['FlowEngine']
 * note: if an context already there, it will be overwritten
 */
function createContext() {
    //need to create a new context that belong to flowengine
    var ns = cls.createNamespace(NS_FLOWENGINE);
    process.context = process.context || {};
    process.context[NS_FLOWENGINE] = ns;
    return ns;
}

module.exports = {
    'getCurrent' : getCurrentContext,
    'create' : createContext
};
