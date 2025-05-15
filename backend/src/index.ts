import Config from "./config";
import LobbyMonitor from "./lobby/monitor";
import Rcon from "./lobby/rcon";

await Config.init();
Rcon.init();
LobbyMonitor.init();