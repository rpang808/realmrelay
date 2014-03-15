// utnotif.js
var ID_MOVE = $.findPacketId("MOVE");
var ID_UPDATE = $.findPacketId("UPDATE");
var ID_NEW_TICK = $.findPacketId("NEW_TICK");
var ID_CREATE_SUCCESS = $.findPacketId("CREATE_SUCCESS");
var ID_NOTIFICATION = $.findPacketId("NOTIFICATION");
var ID_QUESTOBJID = $.findPacketId("QUESTOBJID");


var player_id = -1;
var playerLocation = null;
var lootbags = {};
var lootbaglocs = {};
var send_notif = true;

var tier = 1; // Minimum tier of items to be notifi'ied

var desirables = [
    0xc01, // Demon Blade
    0xa03, // Crystal Sword
    0xc05, // Ancient Stone Sword
    0xcdb, // Pirate King's Cutlass
    0xcdf, // Doctor Swordsworth
    0xc70, // Golden Ankh
    0xc71, // Eye of Osiris
    0xc72, // Pharaoh's Mask
    0xc73, // Golden Cockle
    0xc74, // Golden Conch
    0xc75, // Golden Horn Conch
    0xc78, // Golden Femur
    0xc79, // Golden Ribcage
    0xc7a, // Golden Skull
    0xc7e, // Golden Chalice
    0xc7d, // Pearl Necklace
    0xc7f, // Ruby Gemstone
    0xc7b, // Golden Candelabra
    0xc7c, // Holy Cross
    0xc77, // Golden Bolt
    0xc76, // Golden Nut
    0x722, // Wine Cellar Incantation
    0xc0a, // Dirk of Cronus
    0xc29, // Spirit Dagger
    0xced, // Sunshine Shiv
    0xc02, // Doom Bow
    0xc10, // Coral Bow
    0xcde, // Leaf Bow
    0xcec, // Robobow
    0xc03, // Staff of Extreme Prejudice
    0xcea, // KoalaPOW
    0xc04, // Wand of the Bulwark
    0xb3f, // Crystal Wand
    0xceb, // Spicy Wand of Spice
    0xcdc, // Doku No Ken
    0xcee, // Arbiters Wrath
    0xa5a, // Cloak of the Planewalker
    0xc07, // Quiver of Thunder
    0xc09, // Tome of Purification
    0xc1e, // Tome of Holy Protection
    0xc08, // Helm of the Juggernaut
    0xc0f, // Shield of Ogmur
    0xc06, // Seal of Blasphemous Prayer
    0xc0b, // Orb of Conflict
    0xc2a, // Ghostly Prism
    0xc61, // Candy-Coated Armor
    0xba2, // Ring of the Pyramid
    0xba0, // Ring of the Sphinx
    0xba1, // Ring of the Nile
    0xb3e, // Amulet of Resurrection
    0xbab, // The Forgotten Crown
    0xbad, // Bracer of the Guardian
    0xbac, // The Twilight Gemstone
    0xb41, // Tablet of the King's Avatar
    0xc22, // Bone Dagger
    0xc15, // Staff of the Crystal Serpent
    0xc1d, // St. Abraham's Wand
    0xc33, // Conducting Wand
    0x221c, // Skull-splitter Sword
    0xc18, // Coral Silk Armor
    0xc28, // Spectral Cloth Armor
    0xc1f, // Chasuble of Holy Light
    0xc14, // Robe of the Tlatoani
    0xc32, // Robe of the Mad Scientist
    0xc6e, // Resurrected Warrior's Armor
    0xc6d, // Plague Poison
    0xc16, // Cracked Crystal Skull
    0xc1c, // Coral Venom Trap
    0xc30, // Scepter of Fulmination
    0xc13, // Coral Ring
    0xc20, // Ring of Divine Faith
    0xc27, // Captain's Ring
    0xc31, // Experimental Ring
    0xc5f, // Candy Ring
    //0x709, // Poison Fang Dagger
    //0xa4b, // Sprite Wand
    //0xa3e, // Snake Skin Armor
    //0xa40, // Snake Skin Shield
    //0x708, // Spider's Eye Ring
    //0xa41, // Snake Eye Ring
    //0xc17, // Crystal Bone Ring
	0xa20, // Def Pot	<
	0xa1f, // Att Pot	<
	0xa21, // Spd Pot	<
	0xa34, // Vit Pot   <<<<<< Thanks 059 <3
	0xa35, // Wis Pot 	<
	0xa4c, // Dex Pot	<
	0xae9, // Life Pot	<
	0xaea // Mana Pot	<
];

function onClientPacket(event) {
    var packet = event.getPacket();
    switch (packet.id()) {
    case ID_MOVE:
        {
            var time = packet.time;
            playerLocation = packet.newPosition;

            if (send_notif) {
                for (var bag in lootbags) {
                    if (lootbaglocs[bag].distanceSquaredTo(playerLocation) <= 200) {
                        var params = {}
                        toNotif = "";

                        for (var idx in lootbags[bag]) {
                            if (lootbags[bag][idx] != -1) {
                                var item = $.findItem(lootbags[bag][idx]);
                                toNotif += "\\n" + item.id
                            }
                        }
                        if (toNotif == "") {
                            continue;
                        }
                        this.displayNotification(event, bag, 0x00ffff, toNotif);
						this.quest(event, bag)
						//$.echo("> Quest set to " + bag);
                    }
                }
                send_notif = false;
                $.scheduleEvent(2, "refresh_notif");
            }

            break;
        }
    }
}

function onServerPacket(event) {
    var packet = event.getPacket();
    switch (packet.id()) {
    case ID_CREATE_SUCCESS:
        {
            player_id = packet.objectId;
            break;
        }
    case ID_UPDATE:
        {
            // New objects
            for (var i = 0; i < packet.newObjs.length; i++) {
                var objectData = packet.newObjs[i];
                if (objectData == null)
                    break;

                var type = objectData.objectType;

                if (type == 1280 || type == 1283 || (type >= 1286 && type <= 1296)) {
                    // new loot bag
                    var bagId = objectData.status.objectId;
                    lootbags[bagId] = [-1, -1, -1, -1, -1, -1, -1, -1];
                    lootbaglocs[bagId] = objectData.status.pos;

                    for (var j = 0; j < objectData.status.data.length; j++) {
                        var statData = objectData.status.data[j];
                        if (statData.obf0 >= 8 && statData.obf0 <= 15) {
                            if (statData.obf1 != -1) {
                                var item = $.findItem(statData.obf1);

                                if (item.tier >= tier || item.bagType == 4 || desirables.indexOf(statData.obf1) != -1) {
                                    lootbags[bagId][statData.obf0 - 8] = statData.obf1;
                                }
                            }

                        }
                    }

                }
            }

            // Removed objects
            for (var i = 0; i < packet.drops.length; i++) {
                var droppedObjectId = packet.drops[i];

                if (lootbags[droppedObjectId] != null) {
                    delete lootbags[droppedObjectId];
                    delete lootbaglocs[droppedObjectId];
                }
            }

            break;
        }
    case ID_NEW_TICK:
        {
            for (var i = 0; i < packet.statuses.length; i++) {
                var status = packet.statuses[i];

                if (lootbags[status.objectId] != null) {
                    for (var j = 0; j < status.data.length; j++) {
                        var statData = status.data[j];
                        if (statData.obf0 >= 8 && statData.obf0 <= 15) {
                            if (statData.obf1 == -1) {
                                lootbags[status.objectId][statData.obf0 - 8] = statData.obf1;
                            } else {
                                var item = $.findItem(statData.obf1);

                                if (item.tier >= tier || item.bagType == 4 || desirables.indexOf(statData.obf1) != -1) {
                                    lootbags[status.objectId][statData.obf0 - 8] = statData.obf1;
                                }
                            }

                        }
                    }
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

function refresh_notif(event) {
    send_notif = true;
}



function quest(event, objectId) {
    var QUESTOBJIDPacket = event.createPacket(ID_QUESTOBJID);
    QUESTOBJIDPacket.objectId = objectId;
    event.sendToClient(QUESTOBJIDPacket);
}


//	int objectId