import type { SettingsType } from "$types/data";
import { Message } from "$types/messages";
import WS from "../wsclient.svelte";

const defaultSettings: Partial<SettingsType> = {
    tags: []
}

export default new class Settings {
    settings = $state<SettingsType>(defaultSettings as SettingsType);
    settingsLoaded = $state(false);

    constructor() {
        WS.on(Message.InitialSettings, (config) => {
            this.settings = config;
            this.settingsLoaded = true;
        });

        WS.on(Message.SettingUpdate, ({ key, value }) => {
            // @ts-expect-error headache otherwise
            this.settings[key] = value;
        });
    }
}