// ------------------
// Setup
// ------------------
var express = require('express');
var app = express.createServer();
var io = require("socket.io").listen(app);
io.set('log level', 2);

app.configure('development', function(){
    app.use(express.bodyParser());
    app.use(express.static('./static/'));
    app.use(app.router);
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});
app.register('.js', require('ejs'));
app.register('.html', require('ejs'));

app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});

var port = 8080;

app.listen(port);

// -------------------
// Views
// -------------------
app.get('/cordova-server.js', function(req, res) {
  res.contentType('json');
  res.render('cordova-server', {
      ip : req.connection.address().address,
      port: req.connection.address().port
  });
});

app.get('/cordova.js', function(req, res) {
  res.contentType('json');
  evalOnServer('getRemoteFile("cordova.js", promise)').then(function(originalScript) {
    res.render('cordova-client', {
        originalScript : originalScript,
        ip : req.connection.address().address,
        port: req.connection.address().port
    });
  }, function(error) {
    res.send(error, 500);
  });

});


// ------------------
// Socket-IO
// ------------------
var Promise = require("./views/partials/promise.js").Promise;

var cordovaServerSocket;

function evalOnServer(expression) {
  var res = Promise();
  var socket = cordovaServerSocket;
  socket.emit('remoteEval', expression, function(response) {
    if (!response.success) {
      res.reject.apply(this, response.args);
    } else {
      res.resolve.apply(this, response.args);
    }
  });
  return res;
}

io.sockets.on('connection', function (socket) {
  socket.on("server", function() {
    console.log("got a server");
    cordovaServerSocket = socket;
  });

  socket.on('remoteEval', function (expression, fn) {
      cordovaServerSocket.emit('remoteEval', expression, function(response) {
        fn(response);
      });
    });  
});