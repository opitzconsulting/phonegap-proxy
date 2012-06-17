package com.opitzconsulting.phonegapproxy;

import com.corundumstudio.socketio.Configuration;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Simple socketio server for the Phonegap-Proxy project, implementation written in Java.
 *
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class PhonegapProxyServer {
    private static final Logger LOGGER = LoggerFactory.getLogger(PhonegapProxyServer.class);

    private static enum RemoteType {
        DEVICE, CLIENT
    }

    private static String calcRemoteId(RemoteInfo remote, RemoteType type) {
        return type+(String) remote.info.get("id");
    }

    private static class RemoteInfo {
        private final RemoteType type;
        private final SocketIOClient client;
        private final Map<String, Object> info;

        public RemoteInfo(RemoteType type, SocketIOClient client, Map<String, Object> info) {
            this.type = type;
            this.client = client;
            this.info = info;
        }

        public SocketIOClient getClient() {
            return client;
        }

        public RemoteType getType() {
            return type;
        }

        public Map<String, Object> getInfo() {
            return info;
        }

        @Override
        public String toString() {
            return "RemoteInfo{" +
                    "type=" + type +
                    ", client=" + client +
                    ", info=" + info +
                    '}';
        }
    }

    private final SocketIOServer server;
    private Map<String, RemoteInfo> remotesById = new HashMap<String, RemoteInfo>();
    private Map<SocketIOClient, RemoteInfo> remotesByClient = new HashMap<SocketIOClient, RemoteInfo>();

    public PhonegapProxyServer(SocketIOServer server) {
        this.server = server;
        server.addDisconnectListener(new DisconnectListener() {
            @Override
            public void onDisconnect(SocketIOClient client) {
                RemoteInfo remote = getRemote(client);
                LOGGER.info("disconnected remote "+remote);
                deleteRemote(remote);
            }
        });

        server.addEventListener("device", new DataListener<Object>() {
            @Override
            public void onData(SocketIOClient client, Object data) {
                RemoteInfo remote = addRemote(RemoteType.DEVICE, client, data);
                LOGGER.info("added remote "+remote);
            }
        });

        server.addEventListener("client", new DataListener<Object>() {
            @Override
            public void onData(SocketIOClient client, Object data) {
                RemoteInfo remote = addRemote(RemoteType.CLIENT, client, data);
                LOGGER.info("added remote "+remote);
            }
        });

        forwardTo("exec", RemoteType.DEVICE);
        forwardTo("callback", RemoteType.CLIENT);
        forwardTo("event", RemoteType.CLIENT);

        server.addEventListener("listDevices", new DataListener<Object>() {
            @Override
            public void onData(SocketIOClient client, Object data) {
                client.sendEvent("listDevicesResult", findRemoteData(RemoteType.DEVICE));
            }
        });
    }

    private class ForwardEventListener implements DataListener<Object> {
        private final String eventName;
        private final RemoteType forwardTo;

        private ForwardEventListener(String eventName, RemoteType forwardTo) {
            this.eventName = eventName;
            this.forwardTo = forwardTo;
        }

        @Override
        public void onData(SocketIOClient client, Object data) {
            RemoteInfo fromRemote = getRemote(client);
            RemoteInfo toRemote = getOtherSide(fromRemote, forwardTo);
            if (toRemote==null) {
                LOGGER.error("could not find a forward of type "+forwardTo+" for remote "+fromRemote);
                return;
            }
            toRemote.getClient().sendEvent(eventName, data);
        }
    }

    public void start() {
        server.start();
    }

    private synchronized RemoteInfo addRemote(RemoteType type, SocketIOClient client, Object data) {
        RemoteInfo remote = new RemoteInfo(type, client, (Map<String,Object>)data);
        remotesById.put(calcRemoteId(remote, type), remote);
        remotesByClient.put(client, remote);
        return remote;
    }

    private synchronized void deleteRemote(RemoteInfo remote) {
        remotesById.values().remove(remote);
        remotesByClient.values().remove(remote);
    }

    private synchronized RemoteInfo getRemote(SocketIOClient client) {
        RemoteInfo remote = remotesByClient.get(client);
        return remote;
    }

    private synchronized List<Object> findRemoteData(RemoteType remoteType) {
        List<Object> res = new ArrayList<Object>();
        for (RemoteInfo info: remotesById.values()) {
            if (info.getType()==remoteType) {
                res.add(info.getInfo());
            }
        }
        return res;
    }


    private synchronized RemoteInfo getOtherSide(RemoteInfo remote, RemoteType type) {
        RemoteInfo res = remotesById.get(calcRemoteId(remote, type));
        return res;
    }

    private void forwardTo(String eventName, RemoteType remoteType) {
        server.addEventListener(eventName, new ForwardEventListener(eventName, remoteType));
    }

    public void stop() {
        server.stop();
    }
}
