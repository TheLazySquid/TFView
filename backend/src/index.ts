import Settings from "./settings/settings";
import { flags } from "./consts";
import GameMonitor from "./game/monitor";
import PlayerData from "./game/playerdata";
import Rcon from "./game/rcon";
import History from "./history/history";
import LogParser from "./logParser";
import Server from "./net/server";
import Log from "./log";
import Demos from "./history/demos";
import HistoryDatabase from "./history/database";

if(flags.fakeData) Log.info("Using fake data for backend");
if(flags.noMAC) Log.info("MegaAntiCheat integration disabled");
if(flags.noSteamApi) Log.info("Steam API usage disabled");
init();

async function init() {
    Log.init();

    try {
        Server.init();
    } catch {
        Log.error("Failed to start server, is tfview already running?");
        return;
    }
    
    await Settings.init();
    
    if(!flags.fakeData) {
        Rcon.init();
        LogParser.init();
        PlayerData.init();
        Demos.init();
    }
    
    HistoryDatabase.init();
    History.init();
    GameMonitor.init();
}