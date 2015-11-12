var fetch = require('./index.js');

function resolve(v)
{
    console.log("[resolved] " + JSON.stringify(v));
}

function reject(v)
{
    console.log("[rejected] " + JSON.stringify(v));
}

var task = fetch.createTask({ "id": "001", "name": "foo", "type": "fetch", "method": "GET", "target": "http://9.191.74.197/firmware/msg.txt" });
task.execute({}, {}, resolve, reject);
