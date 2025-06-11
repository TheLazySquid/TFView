import type { SettingsType } from "$types/data";
import { Message } from "$types/messages";
import { PageState } from "./wsclient.svelte";

export default new class Settings extends PageState {
    type = "settings";
    settings = $state<Partial<SettingsType>>({});

    setup() {
        this.ws.on(Message.InitialSettings, (config) => {
            this.settings = config;
        });

        this.ws.on(Message.SettingUpdate, ({ key, value }) => {
            this.settings[key] = value;
        });
    }
}