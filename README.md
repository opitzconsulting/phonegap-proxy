Cordova Proxy
=====================

Description
-------------
This proxy allows the development of a HTML5 app with PhoneGap (Apache Cordova) in a desktop browser using all the native features of cordova, like camera access, ... 

The html5 app will run in a desktop browser, but all native cordova features will be executed on a real mobile device, without simulation. This allows fast roundtrips during development, as well as real access to the hardware.


Why?
---------
When I started developing with PhoneGap, I realized that the development cycles between change and run are long: After a change, you have to build the project and redeploy it on the device. This is in contrast to developing a HTML5 app, where you change a file, refresh your browser and see the result. As long as a project does not use native features, PhoneGap apps may be developed just like web apps. But as soon as native features are used, the problem occurs. PhoneGap-Proxy tries to solve this problem.


Quick Start
-------------

*Build the app*

1. Get an account at PhoneGap Build: [https://build.phonegap.com/](https://build.phonegap.com/)
2. Upload sign keys for your user account: [https://build.phonegap.com/people/edit#pane=signing](https://build.phonegap.com/people/edit#pane=signing)
3. Build the app that will run on your device using PhoneGap Build:
   `ant build-app -Dusername<username> -Dpassword=<password> -Dsignkey=<signkey-title>`

*Start the server*

`ant run-server`

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
MIT License

