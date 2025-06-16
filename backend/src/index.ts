import Settings from "./settings/settings";
import { fakeData } from "./consts";
import GameMonitor from "./game/monitor";
import PlayerData from "./game/playerdata";
import Rcon from "./game/rcon";
import History from "./history/history";
import LogParser from "./logParser";
import Server from "./net/server";
import Log from "./log";

if(fakeData) {
    console.log("Using fake data for backend");
}

Log.init();
await Settings.init();
Rcon.init();
LogParser.init();
PlayerData.init();

History.init();
GameMonitor.init();

Server.init();