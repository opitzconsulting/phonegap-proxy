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

	var container;
	var io;
	var socket;
	var emits = {};
	var ons = {};

	beforeEach(function() {
		container = $("<div></div>");
		$("body").append(container);
		container.append('<input type="text" id="server" value=""/><input type="text" id="channel" value=""/><input type="checkbox" id="connected">');
		container.trigger("create");
		emits = {};
		ons = {};

		socket = {
			on: jasmine.createSpy('on').andCallFake(function(event, callback) {
				ons[event] = callback;
			}),
			emit: jasmine.createSpy('emit').andCallFake(function(event) {
				emits[event] = Array.prototype.slice.call(arguments, 1);
			}),
			disconnect: jasmine.createSpy('disconnect')
		};
		window.io = io = {
			connect: jasmine.createSpy('connect').andReturn(socket)
		};
	
	});

	afterEach(function() {
		container.remove();
	});

	describe('connection handling', function() {
		var someAddr = 'http://someAddr';
		var someChannel = 'someChannel';
		var someDevice;

		beforeEach(function() {
			someDevice = window.device = 'someDevice';
		});

		it('should connect to the server defined in the input', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			expect(io.connect).toHaveBeenCalledWith(someAddr);
		});

		it('should disconnect', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			connected(false);
			expect(socket.disconnect).toHaveBeenCalled();

		});

		it('should submit the channel and the device data on connect', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			ons['connect']();
			expect(emits['device'][0]).toEqual({
				channel: someChannel,
				device: someDevice
			});
		});
		
	});


	describe('clientRequest', function() {
		var someAddr = 'http://someAddr';
		var someChannel = 'someChannel';
		var resultCallback;

		beforeEach(function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			resultCallback = jasmine.createSpy('resultCallback');
		});

		function callClient(data) {
			ons['clientRequest'](data, resultCallback);
		}

		describe('global object function', function() {
			var someGlobalObj;

			beforeEach(function() {
				someGlobalObj = window.someGlobalObj = {
					someFn: jasmine.createSpy('someFn')
				};
			});

			it("should execute the global object function with the given args", function() {
				var someArgs = [1,2];
				callClient({
					remoteFn: {
						globalObjExpr: 'someGlobalObj',
						fnName: 'someFn'
					},
					args: someArgs
				});
				expect(someGlobalObj.someFn).toHaveBeenCalledWith(1,2);
			});

			it("should return the result of the global object function", function() {
				var someResult = 'someResult';
				someGlobalObj.someFn.andReturn(someResult)
				callClient({
					remoteFn: {
						globalObjExpr: 'someGlobalObj',
						fnName: 'someFn'
					}
				});
				expect(resultCallback).toHaveBeenCalledWith({data:someResult, error: false});
			});

			it("should return the error of the global object function", function() {
				var someMessage = 'someMessage';
				someGlobalObj.someFn.andThrow(someMessage)
				callClient({
					remoteFn: {
						globalObjExpr: 'someGlobalObj',
						fnName: 'someFn'
					}
				});
				expect(resultCallback).toHaveBeenCalledWith({data:someMessage, error: true});
			});

			it("should inject callbacks into the function arguments", function() {
				callClient({
					remoteFn: {
						globalObjExpr: 'someGlobalObj',
						fnName: 'someFn'
					},
					args: ['someArg', {callbackId: '123'}]
				});
				var generatedCb = someGlobalObj.someFn.mostRecentCall.args[1];
				expect(typeof generatedCb).toBe('function');
			});

			it("should emit the callback arguments with it's id and channel when the callback is called", function() {
				var someCbArg = 'someCbArg';
				var someCallbackId = '123';
				callClient({
					remoteFn: {
						globalObjExpr: 'someGlobalObj',
						fnName: 'someFn'
					},
					args: ['someArg', {callbackId: someCallbackId}]
				});
				var generatedCb = someGlobalObj.someFn.mostRecentCall.args[1];
				generatedCb(someCbArg);
				expect(emits['callback']).toEqual([someChannel, someCallbackId, [someCbArg]]);
			});
		});

	});

});