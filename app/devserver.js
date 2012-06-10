// ------------------
// Setup
// ------------------
var express = require('express');
var app = express.createServer();
var io = require("socket.io").listen(app);


app.configure('development', function(){
    app.use(express.bodyParser());
    app.use(express.static('./src/'));
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

var port = 8080;

app.listen(port);

io.sockets.on('connection', function (socket) {
  socket.on("test", function() {
    console.log("got a server");
  });
});
