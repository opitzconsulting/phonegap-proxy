package com.opitzconsulting.phonegapproxy;

import org.cometd.bayeux.Message;
import org.cometd.bayeux.server.BayeuxServer;
import org.cometd.bayeux.server.ServerSession;
import org.cometd.server.AbstractService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;

/**
 * Simple cometd server for the Phonegap-Proxy project.
 *
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class DeviceService extends AbstractService {
    private static final Logger LOGGER = LoggerFactory.getLogger(DeviceService.class);

    private static final String DEVICE_DATA_ATTR = "deviceData";

    private WeakHashMap<ServerSession, Object> devices = new WeakHashMap<ServerSession, Object>();

    public DeviceService(BayeuxServer server) {
        super(server, "phonegapserver");
        addService("/meta/disconnect", "processDisconnect");
        addService("/device/*", "processDevice");
        addService("/listDevices", "processListDevices");
    }

    public void processDisconnect(ServerSession remote, Message message) {
        Object deviceData = getDeviceData(remote);
        if (deviceData!=null) {
            devices.remove(remote);
            LOGGER.info("disconnected remote " + deviceData);
        }
    }

    public void processDevice(ServerSession remote, Message message) {
        Object deviceData = message.getData();
        remote.setAttribute(DEVICE_DATA_ATTR, deviceData);
        devices.put(remote, deviceData);
        LOGGER.info("added device " + deviceData);
    }

    public void processListDevices(ServerSession remote, Message message) {
        List<Object> deviceDatas = new ArrayList<Object>(devices.values());
        remote.deliver(remote, "/listDevicesResult", deviceDatas, null);
    }

    private Object getDeviceData(ServerSession deviceSession) {
        return deviceSession.getAttribute(DEVICE_DATA_ATTR);
    }
}
