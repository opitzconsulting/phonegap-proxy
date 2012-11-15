// ------------------
// Setup
// ------------------
var express = require('express');
var app = express();
var http = require('http');
var faye = require('faye');

app.use(express.static(__dirname));

var server = http.createServer(app);
var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
bayeux.attach(server);



var port = 9000;
server.listen(port);
console.log("listening on port "+port);
