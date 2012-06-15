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

	beforeEach(function() {
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
			someDevice = window.device = 'someDevice';
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
			expect(appSocket.emits.device).toEqual([someChannel,someDevice]);
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
					message: someMessage,
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
					message: someMessage,
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
				expect(appSocket.emits.callback[0].message.substring(0,11)).toBe('Error: test');
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

		function checkFunctionCall(object, fnName, args) {
			// create a command from the client
			object[fnName].apply(object, args);
			var command = clientSocket.emits.exec[0];

			// execute the command in the app.
			spyOn(object, fnName);
			appSocket.ons.exec(command);

			// expect that the original function is called by the app with the same arguments
			var call = object[fnName].mostRecentCall;
			var i, arg, hasSuccessCallback;
			for (i=0; i<args.length; i++) {
				var arg = args[i];
				if (typeof arg==='function') {
					expect(typeof call.args[i]).toBe('function');
				} else {
					expect(call.args[i]).toEqual(args[i]);
				}
				if (arg===successCallback) {
					hasSuccessCallback = true;
				}
			}

			// check that the result is passed through unmodified.
			if (hasSuccessCallback) {
				var someMessage = 'someMessage';
				call.args[0](someMessage);
				
				clientSocket.ons.callback(appSocket.emits.callback[0]);
				expect(successCallback).toHaveBeenCalledWith(someMessage);			
			}
		}

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

		it("should support navigator.camera.getPicture", function() {
			checkFunctionCall(navigator.camera, 'getPicture', [successCallback, errorCallback, { quality : 100, destinationType : 2, sourceType : 3, targetWidth : 100, targetHeight : 100, encodingType : 10, mediaType : 20, allowEdit : false, correctOrientation : false, saveToPhotoAlbum : false, popoverOptions : {} }]);
		});				

		it("should support window.device.getInfo", function() {
			// create a command from the client
			window.device.getInfo(successCallback, errorCallback);
			var command = clientSocket.emits.exec[0];

			// execute the command in the app.
			withGlobals({device: 'someDevice'}, function() {
				appSocket.ons.exec(command);
				clientSocket.ons.callback(appSocket.emits.callback[0]);
				expect(successCallback).toHaveBeenCalledWith('someDevice');
			});
		});	

			
	});

});