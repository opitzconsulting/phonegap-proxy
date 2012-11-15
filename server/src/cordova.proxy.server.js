/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/

/*
 * Server code for receiving the messages from the proxy platform
 * and dispatching them to another phonegap platform.
 * <p>
 * Note: This is NOT included in the normal phonegap build,
 * but must be manually included in an app in addition to the normal
 * cordova.js. Therefore, this is no requirejs module!
*/

(function(window) {
	var Faye = window.Faye;

	// ------------------
	// Messaging
	var socket;
	var config;

	function connect(_config) {
		config = _config;
		socket = new Faye.Client(config.url, config);

		socket.subscribe('/findDevices', function() {
			socket.publish('/findDevicesResult', window.device);
		});

		socket.subscribe("/exec/" + config.channel, onExecMessage);
	}

	function disconnect() {
		if(!socket) {
			return;
		}
		socket.disconnect();
	}

	// ----------------
	// Execute Cordova.exec calls from remote clients.

	function onExecMessage(command) {
		var service = execHandlers[command.service];
		var action = service && service[command.action];
		var successCallback, errorCallback;
		if(command.callbackId) {
			var delegateCallbackId;
			if(!action) {
				delegateCallbackId = command.service + cordova.callbackId;
			}
			successCallback = createCallback(command.callbackId, delegateCallbackId, true);
			errorCallback = createCallback(command.callbackId, delegateCallbackId, false);
		}
		try {
			if(!action) {
				// use the default exec...
				var delegateExec = cordova.require("cordova/exec");
				delegateExec(successCallback, errorCallback, command.service, command.action, command.actionArgs);
			} else {
				// use the execHandler
				action(successCallback, errorCallback, command.actionArgs);
			}
		} catch(e) {
			console.log(e);
			var errMsg = getErrorMessage(e);
			if(errorCallback) {
				errorCallback(errMsg);
			}
		}


	}

	function createCallback(callbackId, delegateCallbackId, success) {
		return function(message) {
			// We execute this in a setTimeout(0) so we can detect
			// if the delegateCallbackId was deleted or not.
			// This is important for callbacks that are called multiple times,
			// e.g. as listeners for the location.
			window.setTimeout(function() {
				var args = {
					status: cordova.callbackStatus.OK,
					message: message
				};
				if(cordova.callbacks[delegateCallbackId]) {
					args.keepCallback = true;
				}
				socket.publish("/callback/" + config.channel, {
					callbackId: callbackId,
					success: success,
					args: args
				});
			}, 0);
		};
	}

	function getErrorMessage(e) {
		if(e.stack) {
			return e.stack;
		} else if(e.message) {
			return e.message;
		} else if(e.name) {
			return e.name;
		} else {
			return e.toString();
		}
	}


	// Overridden implementations of Cordova.exec calls using the Cordova API.
	// Needed when we cannot just past a call to Cordova.exec from the client directly
	// to the server. The cases here are required by some platforms only, however their
	// implementation is cross platform as we are using the Cordova API to simulate
	// the native calls.
	var execHandlers = window.execHandlers = {
		File: {
			// Needed for iOS as the result of the native Cordova.exec is URI encoded, i.e. differes from 
			// the common implementation.
			readAsText: function(successCallback, errorCallback, args) {
				var namedArgs = nameArgs(['fileName', 'enc'], args);
				var reader = new FileReader();
				reader.onloadend = function(evt) {
					if(reader.error) {
						errorCallback(reader.error.code);
					} else {
						successCallback(reader.result);
					}
				};
				reader.readAsText(namedArgs.fileName, namedArgs.enc);
			}
		},
		Notification: {
			// Needed for iOS as it does not implement this using a native call.
			beep: function(successCallback, errorCallback, args) {
				var namedArgs = nameArgs(['count'], args);
				navigator.notification.beep(namedArgs.count);
			}
		}

	};

	function nameArgs(names, args) {
		var res = {};
		for(var i = 0; i < names.length; i++) {
			res[names[i]] = args[i];
		}
		return res;
	}


	// ----------------
	// Event-Listener support

	function installEventListeners() {
		var supportedEvents = ['pause', 'resume', 'online', 'offline', 'backbutton', 'batterycritical', 'batterylow', 'batterystatus', 'menubutton', 'searchbutton', 'startcallbutton', 'endcallbutton', 'volumedownbutton', 'volumeupbutton'];
		for(var i = 0; i < supportedEvents.length; i++) {
			addEventHandler(supportedEvents[i]);
		}

		function addEventHandler(event) {
			document.addEventListener(event, function(arg) {
				console.log("event " + event);
				if(socket !== null) {
					socket.publish("/event/" + config.channel, arg);
				}
			}, false);
		}
	}

	document.addEventListener('deviceready', installEventListeners, false);


	// --------------
	// public API
	window.cordovaProxyServer = {
		connect: connect,
		disconnect: disconnect
	};
})(window);