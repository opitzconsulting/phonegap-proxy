// ------------------
// Setup
// ------------------
var express = require('express');
var app = express.createServer();
var faye = require('faye');

var bayeux = new faye.NodeAdapter({mount: '/faye', timeout: 45});
bayeux.attach(app);

app.configure('development', function(){
    app.use(express.static(__dirname));
});

var port = 9000;
app.listen(port);
console.log("listening on port "+port);
