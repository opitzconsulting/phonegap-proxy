package com.opitzconsulting.phonegapproxy;

import org.cometd.bayeux.server.BayeuxServer;

import javax.servlet.*;
import java.io.IOException;

/**
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class ServletInitializer extends GenericServlet {

    public void init() {
        BayeuxServer bayeux = (BayeuxServer) getServletContext().getAttribute(BayeuxServer.ATTRIBUTE);
        new DeviceService(bayeux);
    }

    @Override
    public void service(ServletRequest servletRequest, ServletResponse servletResponse) throws ServletException, IOException {
        throw new ServletException();
    }
}
