Cordova Proxy
=====================

Description
-------------
This proxy allows the development of a HTML5 app with PhoneGap (Apache Cordova) in a desktop browser using all the native features of cordova, like camera access, ... 

The html5 app will run in a desktop browser, but all native cordova features will be executed on a real mobile device, without simulation. This allows fast roundtrips during development, as well as real access to the hardware.


Why?
---------
When I started developing with PhoneGap, I realized that the development cycles between change and run are long: After a change, you have to build the project and redeploy it on the device. This is in contrast to developing a HTML5 app, where you change a file, refresh your browser and see the result. As long as a project does not use native features, PhoneGap apps may be developed just like web apps. But as soon as native features are used, the problem occurs. PhoneGap-Proxy tries to solve this problem.


Features
-----------
- Supports iOS, Android and WP7. 
- Supports all PhoneGap APIs and PhoneGap Events.
- The app is build using PhoneGap Build and a build script, so it is available for all platforms
- The server provides download links for every platform, and also allows the app to be installed from the browser of the mobile device (yes, this also works for iOS!).

TODOs
-----------
- Test against https://github.com/apache/incubator-cordova-mobile-spec


Quick Start
-------------

*Build the app*

1. Get an account at PhoneGap Build: [https://build.phonegap.com/](https://build.phonegap.com/)
2. Upload sign keys for your user account: [https://build.phonegap.com/people/edit#pane=signing](https://build.phonegap.com/people/edit#pane=signing)
3. Build the app that will run on your device using PhoneGap Build:
   `ant buildApp -Dusername<username> -Dpassword=<password> -Dsignkey=<signkey-title>`

*Start the server*

`ant runServer`

*Install the app on your device*

1. Open the url `http://<server-ip>:8080/` in your mobile browser.
2. Download the app for your plattform.

*Start the app on your device*

1. Enter the url of the server: `http://<server-ip>:8080/`
2. Enter a channel name. Channels are used to allow multiple devices to be used on the same server.

*Check the access from the desktop browser*

1. go to `http://<server-ip>:8080/`
2. Select a device and click on the `Demo` link. On the new page you should see
   details about the connected device and should be able to take a picture.

*Build your own phonegap app*

1. include the cordova.js with the url listed on `http://<server-ip>:8080/`, e.g.
   `<script src="http://someUrl:8080/someChannel/cordova.js">`
2. develop everything as usual! 


How it works
------------
The principle is simple: Install a generic app on your device, use desktop browser to develop your app, but with a special cordova.js that will forward all native callouts from the desktop browser to the device.

For this to work I have a small node-js server. The generic app as well as the desktop browser can connect to that server using socket-io, and by this exchange messages. 

The client is an own build of cordova-js, see here: [https://github.com/tigbro/incubator-cordova-js/tree/phonegap-proxy](https://github.com/tigbro/incubator-cordova-js/tree/phonegap-proxy). This introduces the new build platform `proxy`. To generate it just call `jake` and get the file `pkg/cordova.proxy.js`. This platform inherits everything from `common`and implements the `cordova/exec` using a remote call to the device using socket.io.

On the device there is a special dispatching function for the `exec` calls:

- Most of the calls can just be delegated to the real implementation in the current platform.
- Some calls need to be implemented manually using the official PhoneGap API.
  E.g. iOS does not have the `exec` call `Notification.beep`. So we dispatch that exec call to the PhoneGap-API `navigator.notification.beep`, which iOS implements using `Media.play`.
- To decide this, just have a look at the special overrides of the platforms iOS, Android and WP7 in cordova-js (s.a).

Why do we do it this way?

- The code base stays small as only the excptions need to be implemented.
- We are feature complete from the beginning, as we use the existing javascript form cordova-js.
- The interface to call the server (`cordova/exec`) is very simple to implement. This is in contrast to
  manually implementing the PhoneGap API without using cordova-js (then you get Objects with remote functions, synchronous calls, ...).

Why not Bada or Playbook?

- Those platforms do not use `cordova/exec`, so this approach above would require us to 
  dispatch every possible `cordova/exec` call to a valid Cordova API. This is possible, but takes some time...


Dependencies:
---------------
- cordova 1.8
- node.js 0.6
- express
- socket.io express
- ejs
- PhoneGap Build

License: 
------------
Copyright 2011, Tobias Bosch (OPITZ CONSULTING GmbH)
Licensed under the MIT license.




