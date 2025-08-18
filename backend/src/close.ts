import { flags } from "./consts";
import LogParser from "./game/logParser";
import GameMonitor from "./game/monitor";
import Rcon from "./game/rcon";
import HistoryDatabase from "./history/database";
import Demos from "./history/demos";
import History from "./history/history";
import Log from "./log";
import Server from "./net/server";

export function close() {
    Server.close();
    History.close();
    HistoryDatabase.close();
    GameMonitor.close();
    
    if(!flags.fakeData) {
        Rcon.close();
        LogParser.close();
        Demos.close();
    }

    Log.info("Closing backend");
    setTimeout(forceClose, 2500).unref();
}

async function forceClose() {
    await Log.warning("Failed to close gracefully, force closing");
    process.exit(0);
}