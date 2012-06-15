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
// Routes
app.get('/:channel/cordova.js', function(req, res, next) {
  var address = req.connection.address();
  var channel = req.params.channel;
  var device = devices[channel];
  if (!device) {
    res.header('Error', "No device for channel "+channel);
    res.send('data', 500);
    return;
  }
  res.contentType('json');
  res.render('cordova-client', {
      channel: device.channel,
      address: address
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
var clients = {};

io.sockets.on('connection', function (socket) {
  socket.on("device", function(channel, deviceData) {
    console.log("new device on channel "+channel+':'+JSON.stringify(deviceData));
    deviceData.channel = channel;
    deviceData.socket = socket;
    devices[channel] = deviceData;

    socket.on("disconnect", function() {
      console.log("removed device for channel "+channel);
      delete devices[channel];
    });

    socket.on("callback", function(response) {
      var clientSocket = clients[channel];
      if (!clientSocket) {
        console.log("could not find client for channel "+channel);
        return;
      };
      clientSocket.emit("callback", response);
    });

    socket.on("event", function(data) {
      var clientSocket = clients[channel];
      if (!clientSocket) {
        console.log("could not find client for channel "+channel);
        return;
      };
      clientSocket.emit("event", data);
    });
  });

  socket.on("client", function(channel) {
    console.log("new client on channel "+channel);
    clients[channel] = socket;

    socket.on("disconnect", function() {
      console.log("removed client for channel "+channel);
      delete clients[channel];
    });

    socket.on('exec', function (command) {
      var deviceSocket = devices[channel] && devices[channel].socket;
      if (!deviceSocket) {
        console.log("could not find device for channel "+channel);
        return;
      }
      deviceSocket.emit('exec', command);
    });

  });

});