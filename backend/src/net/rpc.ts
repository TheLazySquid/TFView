import { discordAppId } from "$shared/consts";
import Close from "$src/close";
import Rcon from "$src/game/rcon";
import History from "$src/history/history";
import Settings from "$src/settings/settings";
import Log from "$src/log";
import { Client, type SetActivity } from "@xhayper/discord-rpc";

const baseActivity: SetActivity = {
    smallImageKey: "tfview",
    smallImageText: "Playing with TFView",
    smallImageUrl: "https://github.com/TheLazySquid/TFView"
}

export default class CustomRPC {
    static client: Client;
    static state = "In the menu";

    static init() {
        this.client = new Client({ clientId: discordAppId });

        Settings.on("useCustomRPC", (enable) => {
            if(enable) this.client.login();
            else this.client.destroy();
        });

        // After logging in set the initial activity
        this.client.on("ready", () => {
            Log.info("Connected to Discord RPC");

            this.client.user?.setActivity({
                state: this.state,
                ...baseActivity
            });
        });

        // Update the current map
        History.events.on("startGame", (map) => this.updateActivity(`Playing on ${map}`));
        History.events.on("endGame", () => this.updateActivity("In the menu"));

        Rcon.events.on("connect", () => this.updateActivity("In the menu"));
        Rcon.events.on("disconnect", () => this.client.user?.clearActivity());

        if(Settings.get("useCustomRPC")) this.client.login();

        Close.on("close", () => this.client.destroy());
    }

    static updateActivity(state: string) {
        this.state = state;

        if(!Settings.get("useCustomRPC")) return;
        this.client.user?.setActivity({
            state: this.state,
            ...baseActivity
        });
    }
}