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
	    socket.emit("device", channel);
	});

	function createCallback(name, fn) {
		return function() {
	    			fn({
	    				callback: name,
	    				args: Array.prototype.slice.call(arguments)
	    			});
	        	};	
	}

	socket.on('evalOnDevice', function (expression, fn) {
	    try {
	        var callback = {};
	        var hasCallbacks = false;
	        // create necessary callbacks from the expression,
	        // so they cal be used in the eval statement
	        var match;
	        var regex = /callback\.(\w+)/g;
	        while (match = regex.exec(expression)) {
	        	hasCallbacks = true;
	        	callback[match[1]] = createCallback(match[1], fn);
	        }
	        var res = eval(expression);
	        if (!hasCallbacks) {
			    fn({
			    	callback: "success",
			    	args: [res]
			    });
	        }
	    } catch (e) {
	        var errMsg = getErrorMessage(e);
	        console.log("Error evaluating expression "+expression,errMsg);
		    fn({
		    	callback: "error",
		    	args: [errMsg]
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
