"use strict";


module.exports = function ( config ) {
    console.error('params:', JSON.stringify(config));
    
    return function ( req, resp, next ) {
        console.error('execute activity-log task');
        next();
    }
}