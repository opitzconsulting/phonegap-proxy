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
app.register('.plist', require('ejs'));

app.set('view engine', 'ejs');
app.set('view options', {
    layout: false
});

var port = 8080;
app.listen(port);
console.log("listening on port "+port);

// -------------------
// Views
app.get('/:channel/cordova.js', function(req, res, next) {
  var channel = req.params.channel;
  var device = devices[channel];
  if (!device) {
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

function filterList(list, pattern) {
    for (var j=0; j<list.length; j++) {
      if (pattern.test(list[j])) {
        return list[j];
      }
    }      
    return;
}

function downloads(req) {

  var downloadHandlers = {
    ios: function(baseLink, files) {
      return 'itms-services://?action=download-manifest&url='+baseLink+'install.plist';
    },
    blackberry: function(baseLink, files) {
      var jad = filterList(files, /\.jad/);
      return baseLink+jad;
    }
  };


  var result = {};
  var baseDir = './static/appdownload';
  var platforms = fs.readdirSync(baseDir);
  var platform, files, link;
  var baseLink;
  
  var address = req.connection.address();
  var handler;
  for (var i=0; i<platforms.length; i++) {
    platform = platforms[i];
    files = fs.readdirSync(baseDir+'/'+platform);
    handler = downloadHandlers[platform];
    baseLink = "http://"+address.address+":"+address.port+'/appdownload/'+platform+'/';
    if (handler) {
      link = handler(baseLink, files);
    } else {
      link = baseLink+files[0];
    }
    result[platform] = link;
  }
  return result;
}

app.get('/', function(req, res) {
  res.render('index.html', {
    devices: devices,
    address: req.connection.address(),
    downloads: downloads(req)
  });
});

app.get('/appdownload/ios/install.plist', function(req, res) {
  var address = req.connection.address();
  res.render('appdownload/ios/install.plist', {
    ipaFolder: 'http://'+address.address+':'+address.port+'/appdownload/ios'
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
    console.log("starting eval on device");
    deviceSocket.emit('evalOnDevice', expression, function(response) {
      console.log("end eval on device");
      fn(response);
    });
  });  
});