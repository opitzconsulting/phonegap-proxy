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
	
	console.log("connecting to "+server);
	socket = cometd.connect({
		url: server
	}, function(socket) {
		window.device.channel = channel;
	    socket.publish("/device/"+channel, window.device);
	});

	socket.subscribe("/exec/"+channel, onExecMessage);

	function createCallback(callbackId, delegateCallbackId, success) {
		return function(message) {
			// We execute this in a setTimeout(0) so we can detect
			// if the delegateCallbackId was deleted or not.
			window.setTimeout(function() {
				var args = {
						status: cordova.callbackStatus.OK,
						message: message
				};
				if (cordova.callbacks[delegateCallbackId]) {
					args.keepCallback = true;
				}
				socket.publish("/callback/"+channel, {
					callbackId: callbackId, success: success, 
					args: args
				});					
			}, 0);
		}
	}

	function onExecMessage(message) {
		var command = message.data;
    	var service = execHandlers[command.service];
    	var action = service && service[command.action];
	    var successCallback, errorCallback
	    if (command.callbackId) {
		    var delegateCallbackId;
		    if (!action) {
		    	delegateCallbackId = command.service + cordova.callbackId;
		    }
		    successCallback = createCallback(command.callbackId, delegateCallbackId, true);
		    errorCallback = createCallback(command.callbackId, delegateCallbackId, false);
	    }
	    try {
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
	}
}

function installEventListeners() {
	var supportedEvents = ['pause','resume','online','offline','backbutton','batterycritical','batterylow','batterystatus','menubutton',
						   'searchbutton','startcallbutton','endcallbutton','volumedownbutton','volumeupbutton'];
	for (var i=0; i<supportedEvents.length; i++) {
		addEventHandler(supportedEvents[i]);
	}

	function addEventHandler(event) {
		document.addEventListener(event, function(arg) {
			console.log("event "+event);
			socket.publish("/event/"+channel, arg);
		}, false);
	}	
}

document.addEventListener('deviceready', installEventListeners, false);


function disconnect() {
	if (!socket) {
		return;
	}
	socket.disconnect();
}

function nameArgs(names, args) {
	var res = {};
	for (var i=0; i<names.length; i++) {
		res[names[i]] = args[i];
	}
	return res;
}

// Implementation of Cordova.exec using the Cordova API
var execHandlers = window.execHandlers = {
	Device: {
		// Needed for iOS, as it does not support this
		getDeviceInfo: function(successCallback, errorCallback) {
			successCallback(window.device);
		}
	},
	File: {
		// Needed for iOS as it's result is URI encoded
		readAsText: function(successCallback, errorCallback, args) {
			var namedArgs = nameArgs(['fileName', 'enc'], args);
			var reader = new FileReader();
		    reader.onloadend = function(evt) {
		        if (reader.error) {
		        	errorCallback(reader.error.code);
		        } else {
		        	successCallback(reader.result);
		        }
		    };
		    reader.readAsText(namedArgs.fileName, namedArgs.enc);
		}
	},
	Notification: {
		// Needed for iOS as it does not natively support this.
		beep: function(successCallback, errorCallback, args) {
			var namedArgs = nameArgs(['count'], args);
			navigator.notification.beep(namedArgs.count);
		}
	}

};





