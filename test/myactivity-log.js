module.exports = function(config) {
    console.error('init myactivitylog');
    return function(req, resp, next) {
        console.error('myactivitylog');
        next();
    }
}
