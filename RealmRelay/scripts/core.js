// core.js

var ID_HELLO = $.findPacketId("HELLO");
var ID_FAILURE = $.findPacketId("FAILURE");
var ID_RECONNECT = $.findPacketId("RECONNECT");
var ID_CREATE_SUCCESS = $.findPacketId("CREATE_SUCCESS");
var ID_NOTIFICATION = $.findPacketId("NOTIFICATION");

var helloPacket = null;

function onEnable(event) {
	$.echo("Waiting for HELLO from client...");
}

function onConnect(event) {
	$.echo("Connected to remote server.");
	$.sendToServer(helloPacket);
}

function onConnectFail(event) {
	$.echo("Connection to remote server failed!");
	$.kickUser();
}

function onDisconnect(event) {
	$.echo("Disconnected from remote server.");
	$.kickUser();
}

function onClientPacket(event) {
	var packet = event.getPacket();
	switch (packet.id()) {
		case ID_HELLO: {
			event.cancel();
			$.connect(packet.gameId);
			helloPacket = packet;
			$.echo("buildVersion:" + packet.buildVersion);
			break;
		}
	}
}

function onServerPacket(event) {
	var packet = event.getPacket();
	switch (packet.id()) {
		case ID_FAILURE: {
			$.echo(packet + " " + packet.errorId + " " + packet.errorDescription);
			break;
		}
		case ID_RECONNECT: {
			var host;
			var port;
			if (packet.port == -1) { // -1 means same server/port you are on
				host = $.getRemoteHost();
				port = $.getRemotePort();
			} else {
				host = packet.host;
				port = packet.port;
			}
			$.setGameIdSocketAddress(packet.gameId, host, port);
			packet.host = "localhost";
			packet.port = 2050;
			break;
		}
		case ID_CREATE_SUCCESS: {
			ownPlayerId = packet.objectId;
			$.scheduleEvent(1, "displayRealmRelayNotification", ownPlayerId);
			break;
		}
	}
}

function displayRealmRelayNotification(event, playerObjectId) {
	var notificationPacket = $.createPacket(ID_NOTIFICATION);
	notificationPacket.objectId = playerObjectId;
	notificationPacket.message = "{\"key\":\"blank\",\"tokens\":{\"data\":\"Realm Relay enabled!\"}}";
	notificationPacket.color = 0x33FFFF;
	$.sendToClient(notificationPacket);
}