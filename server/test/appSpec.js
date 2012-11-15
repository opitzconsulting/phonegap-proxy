describe('app', function() {
	function input(selector) {
		return function() {
			var el = $(selector);
			if (arguments.length===0) {
				return el.val();
			} else {
				el.val(arguments[0]);
				el.trigger("change");
			}
		}
	}

	function checkbox(selector) {
		return function() {
			var el = $(selector);
			if (arguments.length===0) {
				return el.prop("checked");
			} else {
				el.prop("checked", arguments[0]);
				el.trigger("change");
			}

		};
	}

	var server = input("#server");
	var channel = input("#channel");
	var connected = checkbox("#connected");

	var container, cordovaProxyServer;

	beforeEach(function() {
		cordovaProxyServer = {
			connect: jasmine.createSpy('connect'),
			disconnect: jasmine.createSpy('disconnect')
		};
		window.cordovaProxyServer = cordovaProxyServer;
		container = $("<div></div>");
		$("body").append(container);
		container.append('<input type="text" id="server" value=""/><input type="text" id="channel" value=""/><input type="checkbox" id="connected">');
		container.trigger("create");
	});

	afterEach(function() {
		container.remove();
	});

	describe('connection handling', function() {
		var someAddr = 'http://someAddr';
		var someChannel = 'someChannel';
		var someDevice;
		var oldDevice;

		beforeEach(function() {
			oldDevice = window.device;
			someDevice = window.device = {name: 'someDevice'};
		});

		afterEach(function() {
			window.device = oldDevice;
		});

		it('should connect to the server defined in the input', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			expect(cordovaProxyServer.connect).toHaveBeenCalledWith({url: someAddr, channel: someChannel});
		});

		it('should disconnect', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			connected(false);
			expect(cordovaProxyServer.disconnect).toHaveBeenCalled();

		});
	});

});