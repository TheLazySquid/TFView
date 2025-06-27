import { Recieves } from "$types/messages";
import WS from "../wsclient.svelte"

export default new class Setup {
    launchOptionsValid = $state(false);
    mastercomfig = $state(false);
    password = $state(Math.random().toString(36).slice(2, 10));
    autoexecValid = $state(false);
    steamApiKey = $state("");
    masterbaseKey = $state("");

    constructor() {
        WS.sendAndRecieve(Recieves.GetSetting, "steamApiKey").then((key) => {
            if(key) this.steamApiKey = key;
        });
        WS.sendAndRecieve(Recieves.GetSetting, "masterbaseKey").then((key) => {
            if(key) this.masterbaseKey = key;
        });
    }

    async checkLaunchOptions() {
        this.launchOptionsValid = await WS.sendAndRecieve(Recieves.CheckLaunchOptions, undefined);
        return this.launchOptionsValid;
    }

    async getRconInfo() {
        let password = await WS.sendAndRecieve(Recieves.GetRconPassword, this.mastercomfig);
        if(!password) return;

        this.password = password;
    }

    async checkAutoexec() {
        this.autoexecValid = await WS.sendAndRecieve(Recieves.CheckAutoexec, this.mastercomfig);
        return this.autoexecValid;   
    }
}