import Config from "./config";
import GameMonitor from "./game/monitor";
import Rcon from "./game/rcon";
import Socket from "./socket";

await Config.init();
Rcon.init();
GameMonitor.init();
Socket.init();