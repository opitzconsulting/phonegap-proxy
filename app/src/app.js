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

// Used by deviceEval to read in a remote file
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
	    socket.emit("device", {
	    	channel: channel,
	    	device: window.device
	    });
	});

	function generateCallback(callbackId) {
		return function() {
			socket.emit("callback", channel, callbackId, Array.prototype.slice.call(arguments))
		}
	}

	function generateCallbacks(args) {
		if (!args) {
			return;
		}
		var i, arg;
		for (i=0; i<args.length; i++) {
			arg = args[i];
			if (arg && arg.callbackId) {
				args[i] = generateCallback(arg.callbackId);
			}
		}
	}

	socket.on('clientRequest', function (request, callback) {
	    try {
	    	var globalObj = eval('globalObj = '+request.remoteFn.globalObjExpr);
	    	var fn = globalObj[request.remoteFn.fnName];
	    	generateCallbacks(request.args);
	    	var result = fn.apply(globalObj, request.args);
	    	callback({
	    		error: false,
	    		data: result
	    	});
	    } catch (e) {
	        console.log(e);
	        var errMsg = getErrorMessage(e);
		    callback({
		    	error: true,
		    	data: errMsg
		    });
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
