// ------------------
// Setup
// ------------------
var express = require('express');
var fs = require("fs");
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
app.get('/:channel/cordova.js', function(req, res, next) {
  var channel = req.params.channel;
  var device = devices[channel];
  console.log("channel "+channel+" device: "+device);
  if (!device) {
    console.log("no device for channel "+channel);
    res.header('Error', "No device for channel "+channel);
    res.send(500);
    return;
  }
  res.contentType('json');
  res.render('cordova-client', {
      originalScript : device.originalScript,
      channel: device.channel
  });      
});

function downloads() {
  var platformFilters = {
    ios: /\.plist/,
    blackberry: /\.jad/
  };

  var result = {};
  var baseDir = './static/appdownload';
  var platforms = fs.readdirSync(baseDir);
  var platform, files, filter, file;
  for (var i=0; i<platforms.length; i++) {
    platform = platforms[i];
    files = fs.readdirSync(baseDir+'/'+platform);
    filter = platformFilters[platform];
    file = files[0];
    if (filter) {
      for (var j=0; j<files.length; j++) {
        if (filter.test(files[j])) {
          file = files[j];
          break;
        }
      }      
    }
    result[platform] = 'appdownload/'+platform+'/'+file;
  }
  return result;
}

app.get('/', function(req, res) {
  res.render('index.html', {
    devices: devices,
    downloads: downloads()
  });
});


// ------------------
// Socket-IO
// ------------------
var devices = {};

var deviceSockets = {};

io.sockets.on('connection', function (socket) {
  socket.on("device", function(deviceData) {
    console.log("new device: "+JSON.stringify({channel: deviceData.channel, device: deviceData.device}));
    deviceData.socket = socket;
    devices[deviceData.channel] = deviceData;
    socket.device = deviceData;
  });

  socket.on("disconnect", function() {
    if (socket.device) {
      console.log("removed device for channel "+socket.device.channel);
      delete devices[socket.device.channel];
    }
  });

  // forward calls from the client
  socket.on('evalOnDevice', function (channel, expression, fn) {
    var deviceSocket = devices[channel] && devices[channel].socket;
    if (!deviceSocket) {
      fn({callback: 'error', args: ['Could not find socket for channel '+channel]});
      return;
    }
    deviceSocket.emit('evalOnDevice', expression, function(response) {
      fn(response);
    });
  });  
});