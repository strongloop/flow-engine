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

To execute a flow described in YAML:

```
var flow = require('flowengine')({ config: "flow.yaml" });
// TBD
```

#Sample
