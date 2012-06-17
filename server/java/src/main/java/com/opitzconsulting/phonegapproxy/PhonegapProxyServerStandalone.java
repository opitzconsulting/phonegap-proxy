package com.opitzconsulting.phonegapproxy;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;
import joptsimple.OptionException;
import joptsimple.OptionParser;
import joptsimple.OptionSet;
import joptsimple.OptionSpec;

/**
 * Class for running the server standalone.
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class PhonegapProxyServerStandalone {
    public static final String SERVER = "server";
    public static final String PORT = "port";

    public static void main(String[] args) throws Exception {
        OptionParser parser = new OptionParser();
        OptionSpec<String> server = parser.accepts(SERVER).withRequiredArg().ofType(String.class).defaultsTo("0.0.0.0");
        OptionSpec<Integer> port = parser.accepts( PORT ).withRequiredArg().ofType(Integer.class).defaultsTo(8080);

        OptionSet options = null;
        try {
            options = parser.parse(args);
        } catch (OptionException e) {
            parser.printHelpOn(System.err);
            System.exit(1);
        }

        Configuration config = new Configuration();
        config.setHostname(options.valueOf(server));
        config.setPort(options.valueOf(port));
        new PhonegapProxyServer(new SocketIOServer(config)).start();
    }
}
