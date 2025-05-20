import { join } from "node:path";
import type { ConfigType } from "$types/data";
import { dataPath } from "./consts";

export default class Config {
    static file: Bun.BunFile;
    static config: ConfigType;

    static async init() {
        this.file = Bun.file(join(dataPath, "config.json"));

        if(await this.file.exists()) {
            this.config = await this.file.json();
        } else {
            throw new Error("Config file not found");
        }
    }

    static get<T extends keyof ConfigType>(key: T): ConfigType[T] {
        return this.config[key];
    }

    static set<T extends keyof ConfigType>(key: T, value: ConfigType[T]) {
        this.config[key] = value;
        this.file.write(JSON.stringify(this.config, null, 4));
    }
}