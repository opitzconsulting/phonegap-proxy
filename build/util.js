importPackage(java.lang);
importPackage(java.io);
importPackage(java.util);

function exec(command, args, workingDir) {
	args.unshift(command);
	var processBuilder = new ProcessBuilder(args);
	if (workingDir) {
		processBuilder.directory(new File(workingDir));
	}
	var process = processBuilder.start();
	var result = org.apache.tools.ant.util.FileUtils.readFully(new InputStreamReader(process.getInputStream()));
	var error = org.apache.tools.ant.util.FileUtils.readFully(new InputStreamReader(process.getErrorStream()));
	
	process.waitFor();
	if (process.exitValue()!=0) {
		throw "Error executing "+args.join(" ")+": "+error;
	}
	return result;

}

function log(string) {
	System.out.println(string);
}

function readFileSync(fileName) {
	return ''+org.apache.tools.ant.util.FileUtils.readFully(new java.io.FileReader(fileName));
}

function writeFileSync(fileName, content) {
	var writer = new java.io.FileWriter(fileName);
	writer.write(content);
	writer.close();
}

function mkdirs(fileName) {
	new File(fileName).mkdirs();
}
