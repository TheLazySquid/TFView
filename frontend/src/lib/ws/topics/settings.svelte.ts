import type { SettingsType } from "$types/data";
import { Message, Recieves } from "$types/messages";
import WS from "../wsclient.svelte";
import throttle from "throttleit";

const defaultSettings: Partial<SettingsType> = {
    tags: []
}

export default new class Settings {
    settings = $state<SettingsType>(defaultSettings as SettingsType);
    loaded = $state(false);

    constructor() {
        WS.on(Message.InitialSettings, (config) => {
            this.settings = config;
            this.loaded = true;
        });

        WS.on(Message.SettingUpdate, ({ key, value }) => {
            // @ts-expect-error headache otherwise
            this.settings[key] = value;
        });
    }

    update(key: keyof SettingsType) {
        WS.send(Recieves.UpdateSetting, {
            key,
            value: $state.snapshot(this.settings[key])
        });
    }

    throttled: Partial<Record<keyof SettingsType, () => void>> = {};
    updateThrottled(key: keyof SettingsType) {
        this.throttled[key] ??= throttle(() => {
            this.update(key as keyof SettingsType);
        }, 250);

        this.throttled[key]();
    }
}