// Phonegap Build API.
// See https://build.phonegap.com/docs/write_api

function curl() {
	var args = Array.prototype.slice.call(arguments);
	return exec("curl", args);
}

function listApps(data) {
	return JSON.parse(curl("-u", data.username+":"+data.password, "https://build.phonegap.com/api/v1/apps")).apps;
}

function getApp(data) {
	var app,i;
	var list = listApps(data);
	for (i=0; i<list.length; i++) {
		app = list[i];
		if (app.title==data.title) {
			return app;
		}
	}
}

function saveApp(data) {
	var url = "https://build.phonegap.com/api/v1/apps";
	var curlData = {
		title: data.title,
		version: data.version,
		create_method: 'file',
		keys: data.keys
	};
	var curlArgs = ["-u", data.username+":"+data.password, "-F", "file=@"+data.sourceFile,"-F","data="+JSON.stringify(curlData)];
	var appData = getApp(data);
	if (appData) {
		log("Updating app");
		url+="/"+appData.id;
		curlArgs.splice(0,0,"-X","PUT");
	} else {
		log("Creating app");
	}
	curlArgs.push(url);
	var res= curl.apply(this, curlArgs);
	return JSON.parse(res);
}

function getBuildStatus(data) {
	var status, platform, pending;
	var reslt = {};
	var status = getApp(data).status;
	pending = false;
	for (platform in status) {
		pending = pending || status[platform]=="pending";
	}
	return {
		pending: pending,
		platforms: status
	};
}

function getFileName(url) {
	var lastSlash = url.lastIndexOf('/');
	return url.substring(lastSlash+1);
}

function getPath(url) {
	var lastSlash = url.lastIndexOf('/');
	return url.substring(0, lastSlash);
}

function download(data) {
	var appData = getApp(data);
	var platforms = appData.status;
	var targetDir;
	for (var platform in platforms) {
		if (platforms[platform]=='complete') {
			var link = getDownloadLink(data, appData, platform);
			targetDir = data.targetDir+"/"+platform;
			mkdirs(targetDir);
			var targetFile = targetDir+"/"+getFileName(link);
			log("Downloading "+platform+" from "+link+" to "+targetFile);
			curl("-o", targetFile, link);
			if (platform=="blackberry") {
				// For blackberry: download the jad file and all linked files also
				downloadBlackberryCodFiles(data, link, targetFile);
			} else  if (platform=="ios") {
				// For ios: download ios manifest for wireless installation
				downloadIosWirelessManifest(data, appData);
			}
		}
	}
}

function getDownloadLink(data, appData, platform) {
	var linkHtml = curl("-u", data.username+":"+data.password, "https://build.phonegap.com/apps/"+appData.id+"/download/"+platform);
	return linkHtml.match(/href="([^"]+)/)[1];
}

function downloadBlackberryCodFiles(data, jadUrl, jadFileName) {
	var jadUrlPath = getPath(jadUrl);
	var jadFilePath = getPath(jadFileName);
	var jadContent = readFileSync(jadFileName);				
	var jadRegex = /RIM-COD-URL-\d+: (.*)/g;
	var match;
	while (match = jadRegex.exec(jadContent)) {
		var file = match[1];
		log("Downloading additional file "+file);
		curl("-o", jadFilePath+"/"+match[1], jadUrlPath+"/"+match[1]);
	}
}

function downloadIosWirelessManifest(data, appData) {
	log("Downloading iOS wireless install manifest");
	curl("-u", data.username+":"+data.password, "-o", data.targetDir+"/ios/auto-install.plist", "https://build.phonegap.com/apps/"+appData.id+"/plist");	
}
