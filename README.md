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
- Supports all PhoneGap APIs and PhoneGap Events
- Uses Cordova-js, the common javascript behind all cordova plattform implementations.
  The proxy client is an own platform in cordova-js, see here: [https://github.com/opitzconsulting/incubator-cordova-js/tree/phonegap-proxy/lib/proxy]
- The app can be build using PhoneGap Build (config.xml included)
- The server is generic and runs on multiple platform (ruby, node, java)

TODOs
-----------
- Test against https://github.com/apache/incubator-cordova-mobile-spec
- Rebase proxy plattform to https://github.com/apache/cordova-js, as 
  incubator-cordova-js is not active any more.

Quick Start
-------------

*Start the messaging server*

- execute `npm start`.

Please note: The server can be the server that also serves your app, or it can also be a separate standalone server. PhoneGap Proxy works with both. For node.js and ruby use [Faye](http://faye.jcoglan.com/). For java, use [Cometd](http://docs.cometd.org/reference/#java_server)


*Build the server app using PhoneGap Build*

1. Zip the directory `server/src`.
2. Using [PhoneGap Build](https://build.phonegap.com/): Just upload the zip (`config.xml` is already included).

*Build and run the server app using a PhoneGap native project*

1. Download PhoneGap (http://phonegap.com/download)[http://phonegap.com/download]
2. Build the native project. Execute `server/nativeproject.sh <phonegap-dir> <platform>`. This will create a native project
   under `server/assembly/<platform>` that contains all required sources.
3. Run the app. Execute `server/run.sh <phonegap-dir> <platform>`. This will compile and run 
   the app in the emulator for the given platform.

Note: This only works for android, ios and blackberry. For other platforms, you have to manually
create a native phonegap project and copy the files from `server/src` in it. Also make sure that the
whitelist of accessible servers for that platform allows any servers, as the app needs to connect
to the messaging server (see above).

*Start the demo client*

1. Open the app on your device and enter the server url.
2. Open the file `demo/index.html`. 
3. Click `List`. This should show a list of connected devices.
4. Click on one of the `Demo` links in the list. This should open a new page.
5. The new page should show details about the device (name, uuid, ...)
6. Click on the `Take a picture` button. This should take a picture in the device and show it in the browser.


How it works
------------
The principle is simple: Install a generic app on your device, use desktop browser to develop your app, but with a special cordova.js that will forward all native callouts from the desktop browser to the device.

For this to work we use the `Bayeux` protocol (see (http://cometd.org/documentation/bayeux)[http://cometd.org/documentation/bayeux]). This provides pub/sub messaging between any connected clients, without the need of any furhter server programming. Furthermore, there are servers in java, ruby and node.js for this (see above).

The client is an own build of cordova-js, see here: [https://github.com/opitzconsulting/incubator-cordova-js/tree/phonegap-proxy/lib/proxy](https://github.com/opitzconsulting/incubator-cordova-js/tree/phonegap-proxy/lib/proxy). This introduces the new build platform `proxy`. To generate it just call `jake` and get the file `pkg/cordova.proxy.js` and `lib/proxy/plugin/proxy/cordova.proxy.server.js`. This platform inherits everything from `common`and implements the `cordova/exec` using a remote call to the device using socket.io.

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

Why not socket.io?

- Almost all our projects are written for JEE, so java needs to be supported.


Dependencies:
---------------

*Client*

- cordova 2.1
- faye browser client [http://faye.jcoglan.com/](http://faye.jcoglan.com/)

*Server*

- node.js / Ruby: faye server [http://faye.jcoglan.com/](http://faye.jcoglan.com/)
- java: Cometd [http://docs.cometd.org/reference/#java_server](http://docs.cometd.org/reference/#java_server)

License: 
------------
Copyright 2012, Tobias Bosch (OPITZ CONSULTING GmbH)
Licensed under the MIT license.




