# flow-engine

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

The FlowEngine comes with some prebuilt tasks at [lib/task](lib/task), including -
- if
- invoke-api
- etc (more to be added)
You can use these prebuilt tasks to compose your flow.

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
    - tasks: an object that contains all custom task modules' name and handler function

- `Flow.prototype.parepare(context, next)`:  
   Pass the `context` object and `next` function to the flow instance that you create by the Flow ctor

- `Flow.prototype.run()`:    
   start to execute the flow assembly

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

#APIs for Task developer
A task is the unit of the flow assembly. flow-engine leverages tasks to fulfills
a flow assembly. When developing a custom task, flow-engine provides the following APIs
which are attached to `context.flow`:

- `invoke(assembly, next, options)`:  
  flow-engine runs the given `assembly`. When the assembly finishes. the `next` callback
  will be invoked. the `options` here is the same as the options in `Flow(assembly, optionObj)`
  - assembly: the flow's assembly and it's JSON object
  - next: this callback will be invoked after the assembly finishes
  - options: supports the following options:
    - paramResolver: a function that is used to resolve the placeholder inside the flow assembly
    - tasks: an object that contains all custom task modules' name and handler function
    If these properties don't exist, the parent's will be used.

#Sample

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

### The Task interface
- Every task that is defined inside the config should have a corresponding task module. And the task module should provide setup function and return a task function - `function(context, next)`

  ```
  var taskHandler = require('taskModule')(task_config);
  taskHandler(context, next);
  ```
- **The taks module loading procedure**:
  - use task's name to search the task module and see if there is a task module under options.tasks[taskName].
    The options.tasks here is the options that you pass to Flow's constructor or the setup function.
    The difference is the options.tasks that you pass to the setup function will be processed via the `require()` and each task will turn into a module function. And the options.tasks that you pass to Flow's constructor function shall be module functions already.
  - searching the task module under ./lib/task/ inside the flow-engine's directory.
  - diretcly use `require` against the task's name.

- **Execute a task**:
  - use the `task module loading procedure` above to get task's setup function
  - get the properties/values that defined in the assemble for the task and use paramResolver to replace the placeholder into corresponding value if there is
  - pass the properties/values above into the task's setup function: `function (config)`. Then a task function should return: `function(context, next)`
  - call the function we get from previous step and pass the context obj and next function into it. the `next` here is a callback function that is created by the flow, not the one strong-gateway passes to the flow.
  - when the `next` callback is invoked, the flow engine determinate if there is an error by checking the first argument.
    - if the first argument presents, the flow engine will perform the `Error Handling` procedure
  - if the task finishes without any error, then the flow engine goes to the next task

- **Error Handling**:
  - check if there is local error handling for the task:
    - if yes, then execute the tasks defined in the erorr handling:
      - when the local error handling finishes and the local handling throws another error, then go to global error handling
      - then the flow ends
    - if no, then see if there is any global error handling:
      - no global error handling : use default error handling and then ends the flow
      - global error handling exists: execute the global error handling and then ends the flow


### The `context` object
The `context` object should be created before the flow-engine, probably by using a context middleware before the flow-engine middleware. The most important thing in the context for the flow-engine is the `request` object. Currently, flow-engine uses `context.req` to get request object. flow-engine also uses the `context` object as one of the arguments when invoking every task function. Some flow-engine related functions are attached to `context.flow`. A task could access `context` object, including retrieving and populating properties. When flow-engine finishes, all the information should be stored into the `context` object. Having a middleware after the flow-engine middleware is a typical approach to produce the output content and maybe flush/write to the response object at the same time. 

Currently, flow-engine provides a context module in `./lib/context` which could be used to create the context object. It provides the following APIs:
- createContext([namespace]):  
  create a context object with the specified namespace. namespace is optional.

- The context object provides getter, setter and dot notation to access its variables:
  - get(name):  
    get the variable by name.

  - set(name, value[, readOnly]):    
    add or update a variable with the specified name and value. default value of readOnly is 'false'.
    Use readonly=true to add read-only variable.  
    Note: updating a read-only variable will cause exception.

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