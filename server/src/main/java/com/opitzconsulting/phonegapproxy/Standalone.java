package com.opitzconsulting.phonegapproxy;

import joptsimple.OptionException;
import joptsimple.OptionParser;
import joptsimple.OptionSet;
import joptsimple.OptionSpec;
import org.cometd.server.CometdServlet;
import org.cometd.websocket.server.WebSocketTransport;
import org.eclipse.jetty.server.DispatcherType;
import org.eclipse.jetty.server.Server;
import org.eclipse.jetty.servlet.FilterHolder;
import org.eclipse.jetty.servlet.ServletContextHandler;
import org.eclipse.jetty.servlet.ServletHolder;
import org.eclipse.jetty.servlets.CrossOriginFilter;

import java.util.EnumSet;

/**
 * Class for running the server standalone.
 *
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class Standalone {
    public static final String PORT = "port";

    public static void main(String[] args) throws Exception {
        OptionParser parser = new OptionParser();
        OptionSpec<Integer> port = parser.accepts(PORT).withRequiredArg().ofType(Integer.class).defaultsTo(8080);

        OptionSet options = null;
        try {
            options = parser.parse(args);
        } catch (OptionException e) {
            parser.printHelpOn(System.err);
            System.exit(1);
        }

        Server server = new Server(options.valueOf(port));
        ServletContextHandler context = new ServletContextHandler(ServletContextHandler.SESSIONS);
        context.setContextPath("/");
        server.setHandler(context);

        ServletHolder cometd = new ServletHolder(new CometdServlet());
        cometd.setInitParameter("transports", WebSocketTransport.class.getName());
        cometd.setInitOrder(1);
        context.addServlet(cometd, "/*");

        ServletHolder services = new ServletHolder(new ServletInitializer());
        services.setInitOrder(2);
        context.addServlet(services, "");
        context.addFilter(new FilterHolder(new CrossOriginFilter()), "/*", EnumSet.allOf(DispatcherType.class));

        server.start();
        server.join();
    }
}
