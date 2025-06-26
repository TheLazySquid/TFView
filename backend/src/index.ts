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
import Directories from "./settings/directories";
import Setup from "./setup/setup";

if(flags.fakeData) Log.info("Using fake data for backend");
if(flags.noMAC) Log.info("MegaAntiCheat integration disabled");
if(flags.noSteamApi) Log.info("Steam API usage disabled");
init();

async function init() {
    Log.init();

    let setupMode = await Settings.init();
    setupMode = true; // debugging
    if(setupMode) Log.info("Running in setup mode");

    try {
        Server.init(setupMode);
    } catch {
        Log.error("Failed to start server, is tfview already running?");
        return;
    }
    
    // Needed both normally and in setup mode
    Directories.init();

    if(setupMode) {
        Setup.init(initFunctionality);
    } else {
        initFunctionality();
    }
}

function initFunctionality() {
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