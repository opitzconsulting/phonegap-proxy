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
app.get('/:channel/cordova.js', function(req, res) {
  res.contentType('json');
  var channel = req.params.channel;
  if (!channel) {
    res.send("No channel given", 500);
  }
  evalOnDevice(channel, 'getRemoteFile("cordova.js", callback.success)', {
    success: function(originalScript) {
      res.render('cordova-client', {
          originalScript : originalScript,
          channel: channel
      });      
    },
    error: function(error) {
      console.log("error loading cordova.js from device: ", JSON.stringify(error));
      res.send("Error: "+error, 500);  
    }
  });
});


// ------------------
// Socket-IO
// ------------------
var deviceSockets = {};

function evalOnDevice(channel, expression, callbacks) {
    if (!callbacks.success) {
      callbacks.success = function() { };
    }
    if (!callbacks.error) {
      callbacks.error = function() {
        throw new Error("Error evaluating "+expression+" on device "+arguments);
      };
    }
    var deviceSocket = deviceSockets[channel];
    deviceSocket.emit('evalOnDevice', expression, function(response) {
      var callback = callbacks[response.callback];
      callback.apply(this, response.args);
    });
}

io.sockets.on('connection', function (socket) {
  socket.on("device", function(channel) {
    console.log("got a server on channel "+channel);
    deviceSockets[channel] = socket;
  });

  // forward calls from the client
  socket.on('evalOnDevice', function (channel, expression, fn) {
    var deviceSocket = deviceSockets[channel];
    deviceSocket.emit('evalOnDevice', expression, function(response) {
      fn(response);
    });
  });  
});