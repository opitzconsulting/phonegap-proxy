package com.opitzconsulting.phonegapproxy;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOServer;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

/**
 * For integrating the PhonegapProxyServer into an existing web container.
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class PhonegapProxyServerContextListener implements ServletContextListener {
    private static final String PORT_ATTR_NAME = "PHONEGAP_PROXY_SERVER_PORT";

    private PhonegapProxyServer server;

    @Override
    public void contextInitialized(ServletContextEvent servletContextEvent) {
        ServletContext ctx = servletContextEvent.getServletContext();
        String port = (String) ctx.getAttribute(PORT_ATTR_NAME);
        if (port==null) {
            port = "8888";
        }
        Configuration config = new Configuration();
        config.setHostname("0.0.0.0");
        config.setPort(Integer.parseInt(port));
        server = new PhonegapProxyServer(new SocketIOServer(config));
        server.start();
    }

    @Override
    public void contextDestroyed(ServletContextEvent servletContextEvent) {
        server.stop();
    }
}
