'use strict';

var assert = require('assert');

describe('assembly-flow', function() {
    it('should work with sequential tasks', function(done) {
        let options = {};
        options.flow = './test/assembly-flow/two-sequential-log-task.yaml';
        options.baseDir = __dirname;
        options.tasks = {};
        options.tasks.logTask = 'assembly-task/logTask';

        let flow = require('../index.js')(options);
        let req = {};
        let resp = {};
        flow(req, resp, function() {
            assert.equal(resp.myLog.length, 2);
            assert.equal(resp.myLog[0], 'task1');
            assert.equal(resp.myLog[1], '$(target-host)');
            console.log('=================================\n'+
                        'Final Flow Execution Output:\n' +
                        JSON.stringify(resp, undefined, 2) +
                        '\n=================================');
            done();
        });
    });

    it('should work with conditional tasks', function(done) {
        let options = {};
        options.flow = './test/assembly-flow/if-log-task.yaml';
        options.baseDir = __dirname;
        options.tasks = {};
        options.tasks.logTask = 'assembly-task/logTask';

        let flow = require('../index.js')(options);

        let req = {};
        let resp = {};
        flow(req, resp, function() {
            assert.equal(resp.myLog.length, 3);
            assert.equal(resp.myLog[0], 'task2');
            assert.equal(resp.myLog[1], '$(target-host)');
            assert.equal(resp.myLog[2], 'task4');
            console.log('=================================\n'+
                        'Final Flow Execution Output:\n' +
                        JSON.stringify(resp, undefined, 2) +
                        '\n=================================');
            done();
        });
    });


    it('should work with paramResolver', function(done) {
        let options = {};
        options.flow = './test/assembly-flow/if-log-task.yaml';
        options.baseDir = __dirname;
        options.tasks = {};
        options.tasks.logTask = 'assembly-task/logTask';
        options.paramResolver = 'util/apim-param-resolver';

        options.context = require('../lib/context.js').createContext();
        let flow = require('../index.js')(options);

        let req = {};
        // TODO need to be able to get context easier
        options.context.set('target-host', 'www.somewhere.com');
        let resp = {};
        flow(req, resp, function() {
            assert.equal(resp.myLog.length, 3);
            assert.equal(resp.myLog[0], 'task2');
            assert.equal(resp.myLog[1], 'www.somewhere.com');
            assert.equal(resp.myLog[2], 'task4');
            console.log('=================================\n'+
                        'Final Flow Execution Output:\n' +
                        JSON.stringify(resp, undefined, 2) +
                        '\n=================================');
            done();
        });
    });
});
