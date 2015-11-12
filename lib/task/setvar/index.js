/**
 * SetVar is a javascript based task. It is used to add or modify a variable to
 * the session object.
 **/
"use strict";

var context= require('util');
var util = require('util');

function _isValidString(prop) {
    if (util.isString(prop) && prop.length > 0)
        return true;
    return false;
}

//SetVar ctor
function SetVar(name, vname, vvalue) {
    this.mName = name;
    this.mVarName = vname;
    this.mVarValue = vvalue;
}

SetVar.prototype.execute = function (session, input, resolve, reject) {
    session.setVar(this.mVarName, this.mVarValue);
    resolve();
}

//{ "id": "001", "name": "foo", "type": "setvar", "varname": "foo", "value": "bar" }
function createTask(config) {
    if (util.isString(config.type) && config.type === "setvar")
        if (_isValidString(config.name))
            if (_isValidString(config.varname))
                return new SetVar(config.name, config.varname, config.value);

    return null;
}

module.exports.createTask = createTask;

