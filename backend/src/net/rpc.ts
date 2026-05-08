import { discordAppId } from "$shared/consts";
import Close from "$src/close";
import Rcon from "$src/game/rcon";
import History from "$src/history/history";
import Settings from "$src/settings/settings";
import Log from "$src/log";
import { Client, type SetActivity } from "@xhayper/discord-rpc";
import GameMonitor from "$src/game/monitor";

const baseActivity: SetActivity = {
    smallImageKey: "tfview",
    smallImageText: "Playing with TFView",
    smallImageUrl: "https://github.com/TheLazySquid/TFView"
}

export default class CustomRPC {
    static client: Client;
    static map: string | null = null;
    static currentClass: string | null = null;

    static init() {
        this.client = new Client({ clientId: discordAppId });

        Settings.on("useCustomRPC", (enable) => {
            if(enable) this.client.login();
            else this.client.destroy();
        });

        // After logging in set the initial activity
        this.client.on("ready", () => {
            Log.info("Connected to Discord RPC");
            this.updateActivity();
        });

        this.client.on("disconnected", () => {
            setTimeout(() => this.tryToConnect(), 5000).unref();
        });

        // Update the current map
        History.events.on("startGame", (map) => this.updateMap(map));
        History.events.on("endGame", () => this.updateMap(null));

        // Update the current class
        GameMonitor.events.on("userClassUpdate", (className) => this.updateClass(className));

        Rcon.events.on("connect", () => this.updateMap(null));
        Rcon.events.on("disconnect", () => {
            this.map = null;
            this.currentClass = null;
            this.client.user?.clearActivity();
        });

        if(Settings.get("useCustomRPC")) this.tryToConnect();

        Close.on("close", () => this.client.destroy());
    }

    static async tryToConnect() {
        if(!Settings.get("useCustomRPC")) return;

        try {
            await this.client.login();
        } catch {
            setTimeout(() => this.tryToConnect(), 5000).unref();
        }
    }

    static updateMap(map: string | null) {
        this.map = map;
        this.currentClass = null;
        this.updateActivity();
    }

    static updateClass(className: string | null) {
        if(className === this.currentClass) return;

        this.currentClass = className;
        this.updateActivity();
    }

    static updateActivity() {
        if(!Settings.get("useCustomRPC") || !Rcon.connected) return;

        const activity: SetActivity = {
            state: this.map ? `Playing on ${this.map}` : "In the menu",
            ...baseActivity
        }

        if(this.currentClass) activity.details = `Playing ${this.currentClass}`;
        this.client.user?.setActivity(activity);
    }
}