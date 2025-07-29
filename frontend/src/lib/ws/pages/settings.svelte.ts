import type { SettingsType } from "$types/data";
import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

export default new class Settings {
    settings = $state<Partial<SettingsType>>({});
    settingsLoaded = $state(false);

    constructor() {
        WS.on(Message.InitialSettings, (config) => {
            this.settings = config;
            this.settingsLoaded = true;
        });

        WS.on(Message.SettingUpdate, ({ key, value }) => {
            this.settings[key] = value;
        });
    }
}