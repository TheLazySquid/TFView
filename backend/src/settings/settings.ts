import { join } from "node:path";
import type { SettingsType } from "$types/data";
import { dataPath } from "../consts";
import Server from "src/net/server";
import { Recieves, Message } from "$types/messages";
import EventEmitter from "node:events";

// Fixed ids rather than random ones since if settings somehow get reset
// This means that there's a chance that some tags will be saved
const defaultSettings: Partial<SettingsType> = {
    rconPort: 27015,
    tags: [
        {
            name: "Cheater",
            color: "#930d08",
            id: "cheater"
        },
        {
            name: "Suspicious",
            color: "#c9c020",
            id: "suspicious"
        },
        {
            name: "Friend",
            color: "#037d96",
            id: "friend"
        }
    ],
    userColor: "#7a2f00",
    launchTf2OnStart: false,
    openUiOnStart: false
}

export default class Settings {
    static file: Bun.BunFile;
    static config: SettingsType;
    static events = new EventEmitter();

    static async init() {
        this.file = Bun.file(join(dataPath, "config.json"));
        let setupMode = false;

        try {
            this.config = await this.file.json();
        } catch {
            this.config = defaultSettings as SettingsType;
            setupMode = true;
        }

        Server.onConnect("settings", (reply) => {
            reply(Message.InitialSettings, this.config);
        });

        Server.onConnect("game", (reply) => {
            reply(Message.UserColor, this.config.userColor);
        });

        Server.onConnect("tags", (reply) => {
            reply(Message.Tags, this.config.tags);
        });

        Server.on(Recieves.UpdateSetting, ({ key, value }, { ws }) => {
            this.set(key, value);
            this.events.emit(key, value);

            if(key === "tags") Server.send("tags", Message.Tags, value);
            else if(key === "userColor") Server.send("game", Message.UserColor, value);
            Server.sendOthers(ws, "settings", Message.SettingUpdate, { key, value });
        });

        Server.on(Recieves.GetSetting, (key, { reply }) => {
            reply(this.get(key));
        });

        return setupMode;
    }

    static get<T extends keyof SettingsType>(key: T): SettingsType[T] {
        return this.config[key];
    }

    static set<T extends keyof SettingsType>(key: T, value: SettingsType[T]) {
        this.config[key] = value;
        this.file.write(JSON.stringify(this.config, null, 4));
    }

    static randomPassword() {
        return Math.random().toString(36).slice(2, 10);
    }

    static on<T extends keyof SettingsType>(key: T, callback: (value: SettingsType[T]) => void) {
        this.events.on(key, callback);
    }
}