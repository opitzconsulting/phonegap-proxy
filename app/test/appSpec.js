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
	var appSocket = window.socketioMock.appSocket;
	var clientSocket = window.socketioMock.clientSocket;
	var oldTimeout;

	beforeEach(function() {
		container = $("<div></div>");
		$("body").append(container);
		container.append('<input type="text" id="server" value=""/><input type="text" id="channel" value=""/><input type="checkbox" id="connected">');
		container.trigger("create");
		oldTimeout = window.setTimeout;
		// execute setTimeout synchronously
		window.setTimeout = function(callback) {
			callback();
		};
	});

	afterEach(function() {
		container.remove();
		window.setTimeout = oldTimeout;
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
			expect(io.connect).toHaveBeenCalledWith(someAddr);
		});

		it('should disconnect', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			connected(false);
			expect(appSocket.disconnect).toHaveBeenCalled();

		});

		it('should submit the channel and the device data on connect', function() {
			server(someAddr);
			channel(someChannel);
			connected(true);
			appSocket.ons.connect();
			expect(someDevice.channel).toBe(someChannel);
			expect(appSocket.emits.device[0]).toEqual(someDevice);
		});
		
	});


	describe('exec', function() {
		var oldExecHandlers, execHandlers;
		beforeEach(function() {
			oldExecHandlers = window.execHandlers;
			server('someaddr');
			channel('someChannel');
			connected(true);
			execHandlers = window.execHandlers = {
				someService: {
					someAction: jasmine.createSpy('someAction')
				}
			};
		});

		afterEach(function() {
			window.execHandlers = oldExecHandlers;
		});

		describe('execHandlers', function() {
			it("should dispatch to the execHandler", function() {
				var someCallbackId = '123';
				var someActionArgs = [1,2];
				appSocket.ons.exec({service: 'someService', action: 'someAction', callbackId: someCallbackId, actionArgs: someActionArgs});
				expect(execHandlers.someService.someAction).toHaveBeenCalled();
				var call = execHandlers.someService.someAction.mostRecentCall;
				expect(call.args[2]).toBe(someActionArgs);
			});

			it("should send the successCallback message via socketio", function() {
				var someCallbackId = '123';
				var someActionArgs = [1,2];
				appSocket.ons.exec({service: 'someService', action: 'someAction', callbackId: someCallbackId, actionArgs: someActionArgs});
				var call = execHandlers.someService.someAction.mostRecentCall;
				var someMessage = 'someMessage';
				call.args[0](someMessage);
				expect(appSocket.emits.callback[0]).toEqual({
					args : { status : cordova.callbackStatus.OK, message : someMessage },
					callbackId: someCallbackId,
					success: true
				});
			});

			it("should send the errorCallback message via socketio", function() {
				var someCallbackId = '123';
				var someActionArgs = [1,2];
				appSocket.ons.exec({service: 'someService', action: 'someAction', callbackId: someCallbackId, actionArgs: someActionArgs});
				var call = execHandlers.someService.someAction.mostRecentCall;
				var someMessage = 'someMessage';
				call.args[1](someMessage);
				expect(appSocket.emits.callback[0]).toEqual({
					args : { status : cordova.callbackStatus.OK, message : someMessage },
					callbackId: someCallbackId,
					success: false
				});
			});

			it("should send an error message if an exception occured", function() {
				var someCallbackId = '123';
				var someActionArgs = [1,2];
				execHandlers.someService.someAction.andThrow(new Error('test'));
				appSocket.ons.exec({service: 'someService', action: 'someAction', callbackId: someCallbackId, actionArgs: someActionArgs});
				expect(appSocket.emits.callback[0].callbackId).toBe(someCallbackId);
				expect(appSocket.emits.callback[0].success).toBe(false);
				expect(appSocket.emits.callback[0].args.message.substring(0,11)).toBe('Error: test');
			});
		});

		describe('delegate to cordova exec', function() {
			it("should delegate to cordova exec when no execHandler exists", function() {
				var exec = jasmine.createSpy('exec');
				spyOn(cordova, 'require').andReturn(exec);

				var someService = 'someService2';
				var someAction = 'someAction2';
				var someCallbackId = '123';
				var someActionArgs = [1,2];
				appSocket.ons.exec({service: someService, action: someAction, callbackId: someCallbackId, actionArgs: someActionArgs});
				expect(cordova.require).toHaveBeenCalledWith('cordova/exec');
				var call = exec.mostRecentCall;
				expect(call.args[2]).toBe(someService);
				expect(call.args[3]).toBe(someAction);
				expect(call.args[4]).toBe(someActionArgs);
			});

			it("should send the keepCallback flag if the delegate exec did not remote the callback", function() {
				var exec = jasmine.createSpy('exec');
				spyOn(cordova, 'require').andReturn(exec);

				var someService = 'someService2';
				var someCallbackId = '123';
				
				var nextCallbackId = (someService + cordova.callbackId);
				appSocket.ons.exec({service: someService, action: 'someAction2', callbackId: someCallbackId, actionArgs: [1,2]});
				
				cordova.callbacks[nextCallbackId] = true;
				var call = exec.mostRecentCall;
				call.args[0]();

				expect(appSocket.emits.callback[0]).toEqual({
					args : { status : cordova.callbackStatus.OK, message : undefined, keepCallback:true },
					callbackId: someCallbackId,
					success: true
				});
			});

		});
	});

	describe('event handlers', function() {
		beforeEach(function() {
			server('someaddr');
			channel('someChannel');
			connected(true);
		});
		it("should send a notification to the client when an event happends", function() {
			var someData = 'someData';
			cordova.fireDocumentEvent("pause", {data: someData});
			var emittedEvent = appSocket.emits.event[0];
			expect(emittedEvent.type).toBe("pause");
			expect(emittedEvent.data).toBe(someData);
		});
	});

	describe('exec handlers', function() {
		var successCallback, errorCallback;
		beforeEach(function() {
			server('someaddr');
			channel('someChannel');
			connected(true);

			successCallback = jasmine.createSpy('success');
			errorCallback = jasmine.createSpy('error');
		});

		function withGlobals(globals, callback) {
			var old = {};
			for (var x in globals) {
				old[x] = window[x];
				window[x] = globals[x];
			}
			try {
				return callback();
			} finally {
				for (var x in old) {
					window[x] = old[x];
				}				
			}
		}

		it("should support window.device.getInfo", function() {
			window.device.getInfo(successCallback, errorCallback);
			var command = clientSocket.emits.exec[0];

			withGlobals({device: 'someDevice'}, function() {
				appSocket.ons.exec(command);
				clientSocket.ons.callback(appSocket.emits.callback[0]);
				expect(successCallback).toHaveBeenCalledWith('someDevice');
			});
		});

		describe('FileReader.readAsText', function() {
			it("should call FileReader.readAsText with the arguments from the client", function() {
				// create a command from the client
				var fr1 = new FileReader();
				var someFile = 'someFile';
				var someEnc = 'someEnc';
				fr1.readAsText(someFile, someEnc);

				var command = clientSocket.emits.exec[0];

				// execute the command in the app.
				var fr2;
				spyOn(FileReader.prototype, 'readAsText').andCallFake(function() {
					fr2 = this;
				});
				appSocket.ons.exec(command);

				expect(fr2.readAsText).toHaveBeenCalledWith(someFile, someEnc);
			});

			it("should forward the result to the client", function() {
				var fr1 = new FileReader();
				fr1.onloadend = jasmine.createSpy('onloadend');
				fr1.readAsText('someFile', 'someEnc');

				var command = clientSocket.emits.exec[0];

				var fr2;
				spyOn(FileReader.prototype, 'readAsText').andCallFake(function() {
					fr2 = this;
				});
				appSocket.ons.exec(command);
				var someResult = 'someResult';
				fr2.result = someResult;
				fr2.onloadend();
				
				clientSocket.ons.callback(appSocket.emits.callback[0]);
				
				expect(fr1.onloadend).toHaveBeenCalled();
				expect(fr1.result).toBe(someResult);
			});

			it("should forward FileErrors to the client", function() {
				var fr1 = new FileReader();
				fr1.onloadend = jasmine.createSpy('onloadend');
				fr1.readAsText('someFile', 'someEnc');

				var command = clientSocket.emits.exec[0];

				var fr2;
				spyOn(FileReader.prototype, 'readAsText').andCallFake(function() {
					fr2 = this;
				});
				appSocket.ons.exec(command);
				var someError = "someError";
				fr2.error = new FileError(someError);
				fr2.onloadend();
				
				clientSocket.ons.callback(appSocket.emits.callback[0]);
				
				expect(fr1.onloadend).toHaveBeenCalled();
				expect(fr1.error.code).toBe(someError);

			});
		});

		it("should call navigator.notification.beep with the arguments from the client", function() {
			// create a command from the client
			var someCount = 2;
			navigator.notification.beep(someCount);

			var command = clientSocket.emits.exec[0];

			// execute the command in the app.
			var fr2;
			spyOn(navigator.notification, 'beep');
			appSocket.ons.exec(command);

			expect(navigator.notification.beep).toHaveBeenCalledWith(someCount);
		});			
	});

});