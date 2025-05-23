import Config from "./config";
import { fakeData } from "./consts";
import GameMonitor from "./game/monitor";
import PlayerData from "./game/playerdata";
import Rcon from "./game/rcon";
import History from "./history/history";
import LogParser from "./logParser";
import Socket from "./socket";

if(fakeData) {
    console.log("Using fake data for backend");
}

await Config.init();
Rcon.init();
LogParser.init();
PlayerData.init();

History.init();
GameMonitor.init();

Socket.init();