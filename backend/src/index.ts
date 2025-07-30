import Settings from "./settings/settings";
import { flags } from "./consts";
import GameMonitor from "./game/monitor";
import Rcon from "./game/rcon";
import History from "./history/history";
import LogParser from "./game/logParser";
import Server from "./net/server";
import Log from "./log";
import Demos from "./history/demos";
import HistoryDatabase from "./history/database";
import Directories from "./settings/directories";
import Autoexec from "./setup/autoexec";
import LaunchOptionsCheck from "./setup/launchOptions";
import { Recieves } from "$types/messages";
import Casual from "./casual/casual";
import Launcher from "./game/launcher";
import StartMenu from "./setup/startmenu";
import Values from "./settings/values";
import KillTracker from "./history/killTracker";

init();

async function init() {
    Log.init();

    process.on("uncaughtException", (err) => {
        Log.error("Uncaught exception:", err.stack);
    });

    process.on("unhandledRejection", (reason) => {
        Log.error("Unhandled rejection:", reason);
        console.trace(reason);
    });

    if(flags.fakeData) Log.info("Using fake data for backend");
    if(flags.noMAC) Log.info("MegaAntiCheat integration disabled");
    if(flags.noSteamApi) Log.info("Steam API usage disabled");

    await Promise.all([ Settings.init(), Values.init() ]);
    if(!Settings.get("finishedSetup")) Log.info("Running in setup mode");

    try {
        Server.init();
    } catch {
        Log.error("Failed to start server, is tfview already running?");

        // Leave the console open so the user can see the error
        setInterval(() => {}, 999999);
        return;
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
    Launcher.init();
    StartMenu.init();
    KillTracker.init();

    Server.on(Recieves.CloseApp, async (closeGame) => {
        if(closeGame) await Rcon.run("quit");
        close();
    });
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