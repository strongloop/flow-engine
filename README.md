# flowengine

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
To use the FlowEngine, one must `require('flowengine')`.

- setup function `require('flowengine')(configObj)`
  
  configObj supports the follow options:
  - flow : the flow definition file and it shall be a YAML file
  - paramResolver: a module's **location** that is used to resolve the placeholder inside the flow config
  - tasks: an object that contains all custom task modules' name and **location**
  - baseDir: the base directory that will be used to load modules

  and the return value is a middleware handler
  
- `Flow(flowCfg, optionObj)`
  Create a flow instance with the flowCfg which contains the flow's assembly
  - flowCfg: the flow's assemble and it's JSON object
  - optionObj: supports the following options:
    - paramResolver: a function that is used to resolve the placeholder inside the flow config
    - tasks: an object that contains all custom task modules' name and handler function
    - ctxScope: context's namespace. this will be used to create context object if req.ctx doesn't present

- `Flow.prototype.parepare(req, resp, next)`
   Pass the req, resp and next to the flow instance that you create by the Flow ctor

- `Flow.prototype.run()`
   start to execute the assembly in the flow config

To execute a flow described in YAML:

```
var flow = require('flowengine')({ config: "flow.yaml" });
//the flow is a middleware handler and ready to be used

```

Or directly create a Flow instance with a specific JSON config
```
const Flow = require('flowengine').Flow;
var flow = new Flow( json, optionObj );
//you have to manually pass the req, resp, next into the flow and execute it
flow.prepare(req, resp, next);
flow.run();
```

#Sample

```
var createFlow = require('flowengine');

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
- The flowengine module supports the middleware interface. It returns the middleware handler:

  ```
  var middlewareHandler = require('flowengine')(some_config);
  ```

- Every task/policy that is defined inside the config should have a corresponding task module. And the task module shall also return middleware handler:

  ```
  var taskHandler = require('taskModule')(task_config);
  ```
- The taks module loading procedure:
  - use task's name to search the task module and see if there is task module under options.tasks[taskName].
    The options.tasks here is the options that you pass to Flow's constructor or the setup function.
    The difference is the options.tasks that you pass to the setup function will be processed via the `require()` and each task will turn into a module function. And the options.tasks that you pass to Flow's constructor function shall be module functions alread.
  - keep searching the task module under ./lib/task/ inside the flowengine's directory.
  - diretcly use `require` against the task's name.

