## operation-switch
* Before the execution of the flow, the operation-id must be saved in the context.
* The operation-switch task performs the conditional processing based on "operation-id" only. Do we want to support the other syntax (verb+path)? Need to confirm the syntax of 'path': either /route/{id} or /route/[^\]\*

## throw and the other tasks
* The throw task always throws an error. The other tasks may or may not throw error. To throw error, a task must call next() with the error object, and
    1. the task must keep the error object somewhere, or
    2. the Flow must keep the error object in context.error when it receives the error via next()?

## invoke
* As long as the invoke receives the response code, whether 2xx or not, from the target URL, its execution should be considered as a success. Only when there is any connection error (ex: timeout, host not found, ssl handshake error), the execution will be treated with an error.
* auto-follow v.s. redirect?
