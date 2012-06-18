(function(window) {
	function createSocket() {
		var res = {
			on: jasmine.createSpy('on').andCallFake(function(event, callback) {
				res.ons[event] = callback;
			}),
			emit: jasmine.createSpy('emit').andCallFake(function(event) {
				res.emits[event] = Array.prototype.slice.call(arguments, 1);
			}),
			disconnect: jasmine.createSpy('disconnect'),
			ons: {},
			emits: {},
			reset: function() {
				for (var x in res.ons) {
					delete res.ons[x];
				}
				for (var x in res.emits) {
					delete res.emits[x];
				}				
			}
		}
		return res;
	}

	var appSocket = createSocket();
	var clientSocket = createSocket();

	var socketio = cordova.require('cordova/plugin/proxy/socket.io.client');
	socketio.connect = jasmine.createSpy('connect').andReturn(clientSocket);
	cordova.require('cordova/exec').connect('http://someAddr', 'someChannel');
	cordova.require('cordova/channel').onDeviceReady.fire();


	window.io = {
		connect: jasmine.createSpy('connect').andReturn(appSocket)
	};

	function reset() {
		appSocket.reset();
	}

	window.socketioMock = {
		appSocket: appSocket,
		clientSocket: clientSocket,
		reset: reset
	};

	beforeEach(function() {
		reset();
	});
	
})(window);
