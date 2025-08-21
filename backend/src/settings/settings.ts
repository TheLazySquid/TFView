import { join } from "node:path";
import type { SettingsType } from "$types/data";
import { dataPath } from "../consts";
import Server from "src/net/server";
import { Recieves, Message } from "$types/messages";
import EventEmitter from "node:events";
import { readFile } from "node:fs/promises";

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
    openUiOnStart: false,
    finishedSetup: false
}

export default class Settings {
    static file: Bun.BunFile;
    static settings: SettingsType;
    static events = new EventEmitter();

    static async init() {
        const filePath = join(dataPath, "config.json");
        this.file = Bun.file(filePath);

        try {
            // Can't use this.file.json() because if it fails bun will quietly exit the process
            // Rather than throw an error normally for some reason
            const contents = await readFile(filePath);
            this.settings = JSON.parse(contents.toString());
        } catch {
            this.settings = defaultSettings as SettingsType;
        }

        Server.onConnect("settings", (reply) => {
            reply(Message.InitialSettings, this.settings);
        });

        Server.onConnect("game", (reply) => {
            reply(Message.UserColor, this.settings.userColor);
        });

        Server.onConnect("tags", (reply) => {
            reply(Message.Tags, this.settings.tags);
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
    }

    static get<T extends keyof SettingsType>(key: T): SettingsType[T] {
        return this.settings[key];
    }

    static set<T extends keyof SettingsType>(key: T, value: SettingsType[T]) {
        this.settings[key] = value;
        this.file.write(JSON.stringify(this.settings, null, 4));
        this.events.emit(key, value);
    }

    static randomPassword() {
        return Math.random().toString(36).slice(2, 10);
    }

    static on<T extends keyof SettingsType>(key: T, callback: (value: SettingsType[T]) => void) {
        this.events.on(key, callback);
    }
}