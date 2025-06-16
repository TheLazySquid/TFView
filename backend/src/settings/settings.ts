import { join } from "node:path";
import type { SettingsType } from "$types/data";
import { dataPath } from "../consts";
import Socket from "src/socket";
import { Recieves, Message } from "$types/messages";

export default class Settings {
    static file: Bun.BunFile;
    static config: SettingsType;

    static async init() {
        this.file = Bun.file(join(dataPath, "config.json"));

        if(await this.file.exists()) {
            this.config = await this.file.json();
        } else {
            throw new Error("Config file not found");
        }

        Socket.onConnect("settings", (reply) => {
            reply(Message.InitialSettings, this.config);
        });

        Socket.onConnect("game", (reply) => {
            reply(Message.Tags, this.config.tags);
            reply(Message.UserColor, this.config.userColor);
        });

        Socket.onConnect("playerhistory", (reply) => {
            reply(Message.Tags, this.config.tags);
        });

        // I'd love to do an actual directory picker when picking the steam/tf directories
        // But for some reason there's only like two packages with 0 downloads that do it
        // And both of them suck
        Socket.on(Recieves.UpdateSetting, ({ key, value }, { ws }) => {
            this.set(key, value);

            Socket.sendOthers(ws, "settings", Message.SettingUpdate, { key, value });
        });
    }

    static get<T extends keyof SettingsType>(key: T): SettingsType[T] {
        return this.config[key];
    }

    static set<T extends keyof SettingsType>(key: T, value: SettingsType[T]) {
        this.config[key] = value;
        this.file.write(JSON.stringify(this.config, null, 4));
    }
}