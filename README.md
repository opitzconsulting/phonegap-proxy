Cordova Proxy
=====================

Description
-------------
This proxy allows the development of a HTML5 app with PhoneGap (Apache Cordova) in a desktop browser using all the native features of cordova, like camera access, ... 

The html5 app will run in a desktop browser, but all native cordova features will be executed on a real mobile device, without simulation. This allows fast roundtrips during development, as well as real access to the hardware.


Quick Start
-------------

1. Build the app that will run on your device using PhoneGap Build:
  - 

2. Run the server: `node server.js`;


1. Run the server: `node server.js`
2. Create a new cordova project, as described here: [http://docs.phonegap.com/en/1.8.0/guide_getting-started_index.md.html](http://docs.phonegap.com/en/1.8.0/guide_getting-started_index.md.html)
3. Put the file from `misc/sample-server.html` into the cordova project as `index.html`, and adjust the ip address in that file. Please also adjust the security settings, e.g. for iOS set the `ExternalHosts` in the Cordova.plist correctly.
4. Deploy your cordova project to a native device, e.g. an iPhone.
5. On the console where you started `node server.js` there should be the message `got a server`;
6. Start creating a cordova html5 application in the `static` folder, starting with the file from `static/sample-client.html`, and open it in a desktop browser using the url `http://localhost:8080'. 


Building the app
------------------
Got to the `app` directory.
Execute `ant -Dusername=<user> -Dpassword=<password> -Dsignkey=<key-name>`


Dependencies:
---------------
- cordova 1.7
- node.js 0.6
- express
- socket.io express
- ejs


