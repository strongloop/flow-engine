# flow-engine

[![Build Status](https://apim-jenkins3.hursley.ibm.com/view/API%20Connect/job/flow-engine.nvm/badge/icon)](https://apim-jenkins3.hursley.ibm.com/view/API%20Connect/job/flow-engine.nvm/)

FlowEngine can execute a series of tasks described using YAML, see example YAML below.

```
execute:
  - if:
      condition: "'$(request.content-type)' === 'text/xml'"
      execute:
        - activity-log:
            content: activity01
            error-content: payload01

  - invoke-api:
      target-url: "http://$(target-host)/services/climbing/$(request.path)"
      verb: $(request.verb)   # Takes the verb from the context if not set here.
```

A task in flow-engine is also known as a policy. In this document, `task ` equals `policy`.

The FlowEngine comes with some prebuilt tasks at [lib/task](lib/task), including -
- if
- invoke-api
- etc (more to be added)
You can use these prebuilt task to compose your flow.

If none of the prebuilt tasks meet your needs, you can build your own and
add it to the `lib/task` directory, and FlowEngine can execute it.

#Installation
`npm install`

#APIs
To use the FlowEngine, one must `require('flow-engine')`.

- setup function `require('flow-engine')(configObj)`:  
  configObj supports the follow options:
  - flow : the flow definition file and it shall be a YAML file
  - paramResolver: a module's **location** that is used to resolve the placeholder inside the flow assembly
  - tasks: an object that contains all custom task modules' name and **location**
  - baseDir: the base directory that will be used to load modules

  and the return value is a middleware handler
  
- `Flow(assembly, optionObj)`:  
  Create a flow instance with the flow assembly
  - assembly: the flow's assembly and it's JSON object
  - optionObj: supports the following options:
    - paramResolver: a function that is used to resolve the placeholder inside the flow assembly
    - tasks: an object that contains all custom task modules' name and their handler functions. Use this option to control the creattion/lifecycle of task handlers by yourself. 
    - tid: transaction id. if it doesn't present, flow-engine uses tid() to get tid that is maintained in flow-engine's scope.
    - logger: a bunyan logger obj that flow-engine uses it for logging. if it doesn't present, flow-engine creates its own logger.
    - logLevel: flow-engine uses it to create its own logger if `logger` is not there.

- `Flow.prototype.parepare(context, next)`:  
   Pass the `context` object and `next` function to the flow instance that you create by the Flow ctor

- `Flow.prototype.run()`:    
   Start to execute the flow assembly

- `Flow.prototype.subscribe(event, handler)`:    
   Subscribe an event with an event handler. 
   - event: 'START', 'FISNSH', 'ERROR' or 'pre|post:task-name'
   - handler: a handler should be:  
     `function(event, next)`  
     A handler function would get the event name and a done callback(`next`). The handler must call `next()` when it finishes.

- `Flow.prototype.unsubscribe(event, handler)`:    
   Remove the handler from the event's subscriber list

- `tid()`:    
   get a flow-engine scope transaction Id. Basically, it's an globl counter that start with 1 and increase 1 by each call.

To execute a flow described in YAML:

```
var flow = require('flow-engine')({ config: "flow.yaml" });
//the flow is a middleware handler and ready to be used

```

Or directly create a Flow instance with a specific JSON config
```
const Flow = require('flow-engine').Flow;
var flow = new Flow( json, optionObj );
//you have to manually pass the context and next into the flow and execute it
//get context obj from somewhere or create it by yourself
//and request and response object should be attached to the context obj
flow.prepare(context, next);
flow.run();
```

#APIs for Task/Policy developer
A task is the unit of the flow assembly. flow-engine leverages tasks to fulfills
a flow assembly. When developing a custom task, flow-engine provides the following APIs:

- `invoke(assembly, options, next)`:  
  flow-engine runs the given `assembly`. When the assembly finishes. the `next` callback
  will be invoked. the `options` here is the same as the options in `Flow(assembly, optionObj)`
  - assembly: the flow's assembly and it's JSON object
  - next: this callback will be invoked after the assembly finishes
  - options: supports the following options:
    - paramResolver: a function that is used to resolve the placeholder inside the flow assembly
    - tasks: an object that contains all custom task modules' name and handler function
    If these properties don't exist, the parent's will be used.
- `subscribe(event, handler)`:    
   Subscribe an event with an event handler. 
   - event: 'START', 'FISNSH', 'ERROR' or 'pre|post:task-name'.
   - handler: a handler should be:  
     `function(event, next)`  
     A handler function would get the event name and a done callback(`next`). The handler must call `next()` when it finishes.

- `unsubscribe(event, handler)`:    
   Remove the handler from the event's subscriber list

- `proceed()`:    
   When a task finishes its job, it must call this API to tell flow-engine to run the next task.

- `fail(error)`:    
   When a task finishes its job with error situation, it must call this API to tell flow-engine to run the Error handing to process the error.

- `stop()`:    
   When a task finishes its job and the flow should also end, it must call thsi API to tell flow-engine to finish the assembly execution.

- `logger`:    
   A bunyan logger object which is used for logging.

These APIs are attached to the third param of task handler interface and could be used by task developer. Here is a simple task implementation:

```
'use strict';

module.exports = function ( config ) {

    return function (props, context, flow) {
        var logger = flow.logger;
        logger.info('ENTER mypolicy, params:', JSON.stringify(props));
        //some business logic
        
        //and register a FINISH event handler
        flow.subscribe('FINISH', function(event, next) {
            //this would be executed when a flow finishes
            next();
        });
        
        //call next task
        flow.proceed();
    };
};
```

#Sample
Use the setup function to create a flow-engine middleware and register this middleware to handle all of the requests:
```
var createFlow = require('flow-engine');

var flow = createFlow({
        flow: "flow.yaml",
        tasks: {'activity-log': './myactivity-log.js'},
        baseDir: __dirname});

var app = express();
app.post('/*', [ flow ]);

```

#The Design
### The middleware interface
- The interface is `function(request, response, next)`
- The flow-engine module supports the middleware interface. It returns the middleware handler:

  ```
  var middlewareHandler = require('flow-engine')(some_config);
  middlewareHandler(request, response, next);
  ```

### The Task/Policy interface
- Every task that is defined inside the assembly should have a corresponding task module. And the task module should provide a factory function - `function(config)` and return a task handler function - `function(props, context, flow)`. Therefore, flow-engine will use the task module like this:

  ```
  var taskHandler = require('taskModule')(task_config);
  taskHandler(props, context, flow);
  ```
  
- **Finding task/policy handlers to execute the tasks/policies that defined in the assembly**:
  - tasks under `<flow-engine>/lib/task` are loaded when require('flow-engine'). flow-engine calls these tasks' factory functions with empty config object and keeps the returned task handler functions
  - use task's name to search the task module and see if there is a task module under options.tasks[taskName].
    The options.tasks here is the options that you pass to Flow's constructor or the setup function.
    The difference is the options.tasks that you pass to the setup function will be processed via the `require()`, call its factory function by passing empty config object and get the task handler function. And the options.tasks that you pass to Flow's constructor function shall be task handler functions already.
  - searching the task module under `<flow-engine>/lib/task.
  - diretcly use `require` against the task's name, call its factory function with empty config and get the handler function

- **Execute a task/policy**:
  - use the `Finding task handlers procedure` above to get task's handler function
  - get the properties/values that defined in the assemble for the task and use paramResolver to replace the placeholder into corresponding value if there is
  - call the task handler function we get from step 1 and pass the properties/values, context obj and flow obj into it. the `flow` here is a object which contains a set of APIs:
    - .proceed(): when a task finishes its job successfully, it must call this function to tell flow-engine that its job is done, please continue with next task
    - .fail(error): when a task couldn't finish it job, it must call this function to tell flow-engine that an error is found and ask flow-enigne to handle the error. flow-engine will perform the `Error Handling` precedure then.
    - .subscribe(event, cb): a task could subscribe some specific events. flow-engine would invoke the `cb` when the specific events are triggered. The `cb` shall be a `function(event, next)`. Inside the callback, next() must be called when the callback finishes. Currently, the following events are supported:
      - FINISH: a flow finishes. flow-engine finishes an assembly execution
      - ERROR: an error is threw from an assembly execution
      - pre|post:taskName: before or after a task's exeuction
    - .unsubscribe(event, cb): unsubscribe an event
    - .logger: a bunyan logger object and could be used for logging
  - if the task finishes without any error, then the flow engine goes to the next task

- **Error Handling**:
  - check if there is local error handling for the task:
    - if yes, then execute the tasks defined in the erorr handling:
      - when the local error handling finishes and the local handling throws another error, then go to global error handling
      - then the flow ends
    - if no, then see if there is any global error handling:
      - no global error handling : use default error handling and then ends the flow
      - global error handling exists: execute the global error handling and then ends the flow

### Event
flow-engine supports observable interface and provides `subscribe()` and `unsubscribe()` APIs. Currently, the following events are supported:

- START: flow-engine starts to execute an assembly and none of the policy is executed yet
- FINISH: all of the policies in an assembly are executed successfully
- ERROR: the flow execution ends with an error
- 'pre|post:task-name': before or after the execution of a task/policy. The post event is **only** triggered when a task/policy finishes without any error, even if the 'catch' clause recovers the error.

In order to keep the flow execution is clean, any error that is thrown/created by an event handler would only be logged and then ignored. Therefore, an event handler wouldn't impact the flow execution as well as other event handlers.

You can access the `subscribe()` and `unsubscribe()` from a Flow instance if you use the Flow ctor to create a flow instance. In side a task, the third param of the task handler function is an flow object which contains `subscribe()` and `unsubscribe()` APIs.

### The `context` object
The `context` object should be created before the flow-engine, probably by using a context middleware before the flow-engine middleware. flow-engine uses the `context` object as one of the arguments when invoking every task function. A task could access `context` object, including retrieving and populating properties. When flow-engine finishes, all the information should be stored into the `context` object. Having a middleware after the flow-engine middleware is a typical approach to produce the output content and maybe flush/write to the response object at the same time. 

Currently, flow-engine provides a context module in `./lib/context` which could be used to create the context object. It provides the following APIs:
- createContext([namespace]):  
  create a context object with the specified namespace. namespace is optional.

- The context object provides getter, setter and dot notation to access its variables:
  - get(name):  
    get the variable by name.

  - set(name, value[, readOnly]):    
    add or update a variable with the specified name and value. default value of readOnly is 'false'.
    Use readonly=true to add read-only variable.  
    Note: updating a read-only variable will cause the exception.

  - define(name, getter[,setter, configurable]):
    - `name`: variable name
    - `getter`: getter function
    - `setter`: setter function
    - `configurable`: allow re-define or not. (true|false)

    add or update a variable with the specified getter, setter and configurable.
    Use configruable=false to avoid variable re-define.  
    Note: set new value to a getter-only variable will cause the exception.

  - del(name):  
    delete the variable by name.

  - subscribe(event, handler):  
    subscribe an event with the handler function : `function(event, next)`.

  - unsubscribe(event, handler):  
    unsubscribe the event

  - notify(event, callback):  
    fire the event and all of the handlers are invoked sequentially(based on the registration sequence). Then `callback` is called with undefined or an array of errors that subscriber handlers return.

  - dot notation:  
    You can also use dot notation to access the variables of a context object.
```javascript
        //If a context is created with a namespace - 'fool', you can access its variables like this:    
        var ctx1 = require('./lib/context').createContext('fool');
        ctx1.set('myvar', 'value');
        ctx1.fool.myvar === 'value';
        ctx1.fool.myvar = 'new-value';
        ctx1.get('myvar') === 'new-value';
        //
        //If there is no namepsace, then all of the variables are directly attached to the context object:
        var ctx2 = require('./lib/context').createContext();
        ctx2.set('myvar', 'value');
        ctx2.myvar === 'value';
        ctx2.myvar = 'new-value';
        ctx2.get('myvar') === 'new-value';
```
