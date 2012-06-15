// ------------------
// UI
var doc = $(document);
var connectedSelector = "#connected";
var serverSelector = "#server";
var channelSelector = "#channel";

var connected;
var server;
var channel;

doc.delegate(connectedSelector, "change", function() {
	updateUi();
	if (connected) {
		connect();
	} else {
		disconnect();
	}
});

doc.delegate(serverSelector, "change", function() {
	updateUi();
});

doc.delegate(channelSelector, "change", function() {
	updateUi();
});

function updateUi() {
	connected = $(connectedSelector).prop("checked");
	if (!connected) {
		$(serverSelector).textinput("enable");	
		$(channelSelector).textinput("enable");	
	} else {
		$(serverSelector).textinput("disable");	
		$(channelSelector).textinput("disable");	
	}
	server = $(serverSelector).val();
	channel = $(channelSelector).val();
	localStorage.phoneGapProxy = JSON.stringify({
		server: server,
		channel: channel
	});
}

$(function() {
	if (localStorage.phoneGapProxy) {
		try {
			var data = JSON.parse(localStorage.phoneGapProxy);
			$(serverSelector).val(data.server);
			$(channelSelector).val(data.channel);
		} catch (e) {
			console.log(e);
		}
	}
	updateUi();
});


// ------------------
// Messaging

function getErrorMessage(e) {
	if (e.stack) {
		return e.stack;
	} else if (e.message) {
		return e.message;
	} else if (e.name) {
		return e.name;
	} else {
		return e.toString();
	}
}

// Needed for proxy XHR implementation
function getRemoteFile(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
      if (xhr.readyState===4) {
        callback(xhr.responseText);
      };
    }
    xhr.send();
}

var socket;
function connect() {
	socket = io.connect(server);

	socket.on("connect", function() {
	    socket.emit("device", channel, window.device);
	});

	function createCallback(callbackId, success) {
		return function(message) {
			socket.emit("callback", {callbackId: callbackId, success: success, message: message});
		}
	}

	socket.on('exec', function (command) {
	    var successCallback, errorCallback
	    if (command.callbackId) {
		    successCallback = createCallback(command.callbackId, true);
		    errorCallback = createCallback(command.callbackId, false);
	    }
	    try {
	    	var service = execHandlers[command.service];
	    	var action = service && service[command.action];
	    	if (!action) {
	    		// use the default exec...
				var delegateExec = cordova.require("cordova/exec");
	    		delegateExec(successCallback, errorCallback, command.service, command.action, command.actionArgs);
	    	} else {
	    		action(successCallback, errorCallback, command.actionArgs);
	    	}
	    } catch (e) {
	        console.log(e);
	        var errMsg = getErrorMessage(e);
	        if (errorCallback) {
	        	errorCallback(errMsg);
	        }
	    }
	});
}

function disconnect() {
	if (!socket) {
		return;
	}
	socket.disconnect();
	socket = null;
	io.j = [];
	io.sockets = [];
}

// Implementation of Cordova.exec using the Cordova API
var execHandlers = window.execHandlers = {
	Camera: {
		takePicture: function(successCallback, errorCallback, args) {
			var options = {};
			var argNames = ['quality', 'destinationType', 'sourceType', 'targetWidth', 'targetHeight', 'encodingType', 'mediaType', 'allowEdit', 'correctOrientation', 'saveToPhotoAlbum', 'popoverOptions'];
			for (var i=0; i<args.length; i++) {
				options[argNames[i]] = args[i];
			}
			navigator.camera.getPicture(successCallback, errorCallback, options);
		}
	},
	Device: {
		getDeviceInfo: function(successCallback, errorCallback) {
			successCallback(window.device);
		}
	}
};





