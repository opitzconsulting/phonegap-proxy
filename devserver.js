// ------------------
// Setup
// ------------------
var express = require('express');
var app = express.createServer();

app.configure('development', function(){
    app.use(express.bodyParser());
    app.use(express.static(__dirname));
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var port = 9000;
app.listen(port);
console.log("listening on port "+port);
