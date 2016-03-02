'use strict';
const createContext = require('../lib/context').createContext;
const Flow          = require('../lib/flow').Flow;
const yaml          = require('yamljs');
const should        = require('should');

function createFlow(assembly, tasks, paramResolver, done) {

    var config = yaml.load(assembly);
    //start to run the flow engine
    var ctx = createContext();
    if (config.context) {
        for (var key in config.context) {
            ctx.set(key, config.context[key]);
        }
    }

    var taskHandlers = {};
    for(let task in tasks) {
        taskHandlers[task] = require(tasks[task])({});
    }

    var flow = new Flow(config,
            { 'paramResolver': require(paramResolver)(),
        'tasks': taskHandlers,
            });
    flow.prepare(ctx, done);
    flow.run();
    return ctx;
}

describe('policy execution', () => {
   describe('bugs', () => {
       describe('issue 35', () => {
           it('should be no-op when call next twice', (done) => {
               createFlow(__dirname + '/test-flow/simple.yaml',
                       {'bad-policy': __dirname + '/test-flow/bad-policy',
                        'set-code': __dirname + '/test-flow/set-code'
                       },
                       __dirname + '/util/apim-param-resolver',
                       () => {
                           done();
                       });
           });
       });
    });

   describe('flow stop', () => {
       it('should stop flow after first policy', (done) => {
           var ctx = createFlow(__dirname + '/test-flow/flow-stop.yaml',
                   {'mypolicy': __dirname + '/test-flow/mypolicy'},
                   __dirname + '/util/apim-param-resolver',
                   () => {
                       should(ctx.get('foo')).exactly('bar');
                       done();
                   });
       });
    });
});
