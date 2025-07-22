import { Message, Recieves } from "$types/messages";
import Server from "src/net/server";
import Settings from "src/settings/settings";
import { exec } from "node:child_process";
import { flags } from "src/consts";

export default class Launcher {
    static init() {
        // Check if we need to auto-launch
        if(!flags.fakeData && Settings.get("launchTf2OnStart")) {
            this.launchGame();
        }

        Server.on(Recieves.LaunchGame, (_, { ws }) => {
            let failed = this.launchGame();
            if(!failed) return;
           
            Server.sendTo(ws, Message.Error, "Failed to launch TF2, missing steam path");
        });
    }

    static launchGame() {
        const steamPath = Settings.get("steamPath");
        if(!steamPath) return true;

        // Oughta be cross-platform
        exec("steam steam://rungameid/440", { cwd: steamPath });
    }
}