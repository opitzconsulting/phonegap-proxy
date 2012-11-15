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
	if(connected) {
		window.device.channel = channel;

		console.log("connecting to " + server + " with channel " + channel);
		cordovaProxyServer.connect({url:server, channel:channel});
	} else {
		cordovaProxyServer.disconnect();
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
	if(!connected) {
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
	if(localStorage.phoneGapProxy) {
		try {
			var data = JSON.parse(localStorage.phoneGapProxy);
			$(serverSelector).val(data.server);
			$(channelSelector).val(data.channel);
		} catch(e) {
			console.log(e);
		}
	}
	updateUi();
});