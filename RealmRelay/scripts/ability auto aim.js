// ability.js

var ID_MOVE = $.findPacketId("MOVE");
var ID_USE_ITEM = $.findPacketId("USEITEM");
var ID_UPDATE = $.findPacketId("UPDATE");
var ID_NEW_TICK = $.findPacketId("NEW_TICK");
var ID_NOTIFICATION = $.findPacketId("NOTIFICATION");
var ID_PLAYER_TEXT = $.findPacketId("PLAYERTEXT");
var ID_CREATE_SUCCESS = $.findPacketId("CREATE_SUCCESS");
var ID_PLAYER_SHOOT = $.findPacketId("PLAYER_SHOOT");

var playerLocation = null;
var toHitIds = {};

var ability = true;
var player_id = -1;
var type = -1;

var enemies = { 
                "5952"  : "Oryx 1",
                "2354"  : "Oryx 2",
                "3425"  : "Hermit God",
                "3412"  : "Sphinx",
                "3417"  : "Cube God",
                "3414"  : "Skull Shrine",
                "3422"  : "Pentaract",
                "3639"  : "Ghost Ship",
                "24184" : "Rock Dragon",
                "3408"  : "LotLL",
                "3334"  : "Limon",
                "3472"  : "Septavius",
                "5894"  : "Thessal",
                "2357"  : "Crystal",
                "2369"  : "C Prisoner",
                "1618"  : "Sprite God",
                "1620"  : "Medusa",
                "1621"  : "Ent God",
                "1622"  : "Beholder",
                "1623"  : "Flying Brain",
                "1624"  : "Slime God",
                "1625"  : "Ghost God",
                "1752"  : "Leviathan",
                "2309"  : "Rock Bot",
                "2330"  : "Djinn",
                // "1540"  : "Scorpion Queen" // Non-Lethal test - Found on beaches
              };

// Maybe add distance check

function onClientPacket(event) {
	var packet = event.getPacket();
	switch (packet.id()) {
		case ID_MOVE: {
			playerLocation = packet.newPosition;
			break;
		}
		case ID_USE_ITEM: {
			var itemId = event.findItem(packet.slotObject.objectType).id.toLowerCase();

			if(!ability || toHitIds == {} || itemId.indexOf("prism") != -1 || itemId.indexOf("planewalker") != -1)
				break;
			
			// Targets closest desired enemy
			var min_dist = -1;
			var toHitLoc = null;
			for(var objId in toHitIds){
				var dist = playerLocation.distanceSquaredTo(toHitIds[objId]);

				if(min_dist == -1 || dist < min_dist){
					toHitLoc = toHitIds[objId];
					min_dist = dist;					
				}
			}
			if(min_dist <= 200 && toHitLoc != null){
				packet.itemUsePos.x = toHitLoc.x;
				packet.itemUsePos.y = toHitLoc.y + .01; // If the location is exact, all bullets miss.			
			}
			break;
		}
		case ID_PLAYER_TEXT: {
			var text = packet.text;
			if(text == "/abi"){
				event.cancel();

				ability = !ability;

				if(ability)
					this.displayNotification(event, player_id, 0xFF3333, "Auto-Aim abilities enabled");
				else
					this.displayNotification(event, player_id, 0xFF3333, "Auto-Aim abilities disabled");
			}
			break;
		}
	}
}

function onServerPacket(event) {
	var packet = event.getPacket();
	switch (packet.id()) {
		case ID_CREATE_SUCCESS: {
			player_id = packet.objectId;
			break;
		}
		case ID_UPDATE: {
			// New objects
			for (var i = 0; i < packet.newObjs.length; i++) {
				var objectData = packet.newObjs[i];
				if(objectData == null)
					break;

				var type = objectData.objectType;

				if(enemies[type] != null){
					// A Challenger Appears
					toHitIds[objectData.status.objectId] = objectData.status.pos;
				}
			}

			// Removed objects
			for (var i = 0; i < packet.drops.length; i++) {
				var droppedObjectId = packet.drops[i];

				if(toHitIds[droppedObjectId] != null){
					delete toHitIds[droppedObjectId];			
				}
			}

			break;
		}
		case ID_NEW_TICK: {
			for (var i = 0; i < packet.statuses.length; i++) {
				var status = packet.statuses[i];

				if(toHitIds[status.objectId] != null){
					// Location Updated
					toHitIds[status.objectId] = status.pos;
				}
			}
			break;
		}
	}
}

function displayNotification(event, playerObjectId, color, text) {
	var notificationPacket = event.createPacket(ID_NOTIFICATION);
	notificationPacket.objectId = playerObjectId;
	notificationPacket.message = "{\"key\":\"blank\",\"tokens\":{\"data\":\"" + text + "\"}}";
	notificationPacket.color = color;
	event.sendToClient(notificationPacket);
}