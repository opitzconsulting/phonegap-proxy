package com.opitzconsulting.phonegapproxy;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import org.hamcrest.CoreMatchers;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.hamcrest.CoreMatchers.*;
import static org.junit.Assert.assertThat;
import static org.mockito.Mockito.*;

/**
 * @author Tobias Bosch (OPITZ CONSULTING GmbH)
 */
public class PhonegapProxyServerTest {
    private static final Map<String, String> DEFAULT_CONNECT_DATA = Collections.singletonMap("id", "default");

    private PhonegapProxyServer server;
    private SocketIOServer ioServer;
    private Map<String, DataListener> listeners;
    private DisconnectListener disconnectListener;
    private SocketIOClient device;
    private SocketIOClient client;

    @Before
    public void init() {
        ioServer = mock(SocketIOServer.class);
        server = new PhonegapProxyServer(ioServer);
        readEventListenersFromMock();
    }

    private void readEventListenersFromMock() {
        ArgumentCaptor<DisconnectListener> disconnectCaptor = ArgumentCaptor.forClass(DisconnectListener.class);
        verify(ioServer).addDisconnectListener(disconnectCaptor.capture());
        disconnectListener = disconnectCaptor.getValue();

        listeners = new HashMap<String, DataListener>();
        ArgumentCaptor<String> eventCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<DataListener> listenerCaptor = ArgumentCaptor.forClass(DataListener.class);
        verify(ioServer, Mockito.atLeastOnce()).addEventListener(eventCaptor.capture(), listenerCaptor.capture());
        for (int i=0; i<eventCaptor.getAllValues().size(); i++) {
            listeners.put(eventCaptor.getAllValues().get(i), listenerCaptor.getAllValues().get(i));
        }
    }

    @Test
    public void startShouldStartTheServer() {
        server.start();
        verify(ioServer).start();
    }

    @Test
    public void stopShouldStopTheServer() {
        server.stop();
        verify(ioServer).stop();
    }

    @Test
    public void itShouldInstallTheEventListeners() {
        assertThat(disconnectListener, not(nullValue()));
        assertThat(listeners.get("device"), not(nullValue()));
        assertThat(listeners.get("client"), not(nullValue()));
        assertThat(listeners.get("exec"), not(nullValue()));
        assertThat(listeners.get("callback"), not(nullValue()));
        assertThat(listeners.get("event"), not(nullValue()));
        assertThat(listeners.get("listDevices"), not(nullValue()));
    }

    @Test
    public void shouldForwardTheEventsToTheRightPlaces() {
        shouldForwardToDevice("exec");
        shouldForwardToClient("callback");
        shouldForwardToClient("event");
    }

    @Test
    public void itShouldNoMoreForwardAfterDisconnect() {
        shouldNoMoreForwardWhenDeviceDisconnected("exec");
        shouldNoMoreForwardWhenClientDisconnected("callback");
        shouldNoMoreForwardWhenClientDisconnected("event");
    }

    @Test
    public void itShouldListTheConnectedDevices() {
        connectClient(Collections.singletonMap("id", "someClient"));
        Map<String, Object> deviceConnectData = new HashMap<String, Object>();
        deviceConnectData.put("id", "someServer");
        connectDevice(deviceConnectData);

        SocketIOClient webInterfaceClient = mock(SocketIOClient.class);

        DataListener<Object> listener = listeners.get("listDevices");
        listener.onData(webInterfaceClient, null);

        ArgumentCaptor<Object> deviceListCaptor = ArgumentCaptor.forClass(Object.class);
        verify(webInterfaceClient).sendEvent(eq("listDevicesResult"), deviceListCaptor.capture());
        List<Object> deviceData = (List<Object>) deviceListCaptor.getValue();
        assertThat(deviceData.size(), equalTo(1));
        assertThat(deviceData.get(0), sameInstance((Object) deviceConnectData));
    }

    private void shouldNoMoreForwardWhenDeviceDisconnected(String eventName) {
        connectClient(DEFAULT_CONNECT_DATA);
        connectDevice(DEFAULT_CONNECT_DATA);

        disconnectListener.onDisconnect(device);
        Object someData = new Object();
        listeners.get(eventName).onData(client, someData);

        verify(device, never()).sendEvent(anyString(), anyObject());
    }

    private void shouldNoMoreForwardWhenClientDisconnected(String eventName) {
        connectClient(DEFAULT_CONNECT_DATA);
        connectDevice(DEFAULT_CONNECT_DATA);

        disconnectListener.onDisconnect(client);
        Object someData = new Object();
        listeners.get(eventName).onData(device, someData);

        verify(device, never()).sendEvent(anyString(), anyObject());
    }

    private void shouldForwardToDevice(String eventName) {
        connectClient(DEFAULT_CONNECT_DATA);
        connectDevice(DEFAULT_CONNECT_DATA);

        Object someData = new Object();
        listeners.get(eventName).onData(client, someData);
        verify(device).sendEvent(eventName, someData);
    }

    private void shouldForwardToClient(String eventName) {
        connectClient(DEFAULT_CONNECT_DATA);
        connectDevice(DEFAULT_CONNECT_DATA);

        Object someData = new Object();
        listeners.get(eventName).onData(device, someData);
        verify(client).sendEvent(eventName, someData);
    }

    private SocketIOClient connectDevice(Map data) {
        device = mock(SocketIOClient.class);
        DataListener<Object> deviceListener = listeners.get("device");
        deviceListener.onData(device, data);
        return device;
    }

    private SocketIOClient connectClient(Map data) {
        client = mock(SocketIOClient.class);
        DataListener<Object> clientListener = listeners.get("client");
        clientListener.onData(client, data);
        return client;
    }
}
