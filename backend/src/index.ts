import Settings from "./settings/settings";
import { flags } from "./consts";
import GameMonitor from "./game/monitor";
import Rcon from "./game/rcon";
import History from "./history/history";
import LogParser from "./logParser";
import Server from "./net/server";
import Log from "./log";
import Demos from "./history/demos";
import HistoryDatabase from "./history/database";
import Directories from "./settings/directories";
import Autoexec from "./setup/autoexec";
import LaunchOptionsCheck from "./setup/launchOptions";
import { Message, Recieves } from "$types/messages";
import Casual from "./casual/casual";

Server.on(Recieves.CloseApp, async (closeGame) => {
    if(closeGame) await Rcon.run("quit");
    close();
});

init();

async function init() {
    Log.init();

    if(flags.fakeData) Log.info("Using fake data for backend");
    if(flags.noMAC) Log.info("MegaAntiCheat integration disabled");
    if(flags.noSteamApi) Log.info("Steam API usage disabled");

    try {
        Server.init();
    } catch {
        Log.error("Failed to start server, is tfview already running?");
        return;
    }

    let setupMode = await Settings.init();
    if(setupMode) {
        Log.info("Running in setup mode");
        Server.setupMode = true;
    }

    Directories.init();
    LaunchOptionsCheck.init();
    Autoexec.init();

    if(!flags.fakeData) {
        Rcon.init();
        LogParser.init();
        Demos.init();
    }
    
    HistoryDatabase.init();
    History.init();
    GameMonitor.init();
    Casual.init();
}

function close() {
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