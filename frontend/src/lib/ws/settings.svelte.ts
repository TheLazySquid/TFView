import type { SettingsType } from "$types/data";
import { SettingsMessages } from "$types/messages";
import { PageState } from "./wsclient.svelte";

export default new class Settings extends PageState<"settings"> {
    type = "settings";
    settings = $state<Partial<SettingsType>>({});

    setup() {
        this.ws.on(SettingsMessages.Initial, (config) => {
            this.settings = config;
        });

        this.ws.on(SettingsMessages.Update, ({ key, value }) => {
            this.settings[key] = value;
        });
    }
}