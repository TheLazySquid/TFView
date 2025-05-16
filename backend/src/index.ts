import Config from "./config";
import GameMonitor from "./game/monitor";
import Rcon from "./game/rcon";
import Socket from "./socket";

if(Bun.env.FAKE_DATA === "true") {
    console.log("Using fake data for backend");
}

await Config.init();
Rcon.init();
GameMonitor.init();
Socket.init();