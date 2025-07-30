import { join } from "node:path";
import type { ValuesType } from "$types/data";
import { dataPath } from "../consts";
import { readFile } from "node:fs/promises";

export default class Values {
    static file: Bun.BunFile;
    static values: ValuesType;

    static async init() {
        const filePath = join(dataPath, "values.json");
        this.file = Bun.file(filePath);

        try {
            const contents = await readFile(filePath);
            this.values = JSON.parse(contents.toString());
        } catch {
            this.values = {};
        }
    }

    static get<T extends keyof ValuesType>(key: T): ValuesType[T] {
        return this.values[key];
    }

    static set<T extends keyof ValuesType>(key: T, value: ValuesType[T]) {
        this.values[key] = value;
        this.save();
    }

    static save() {
        this.file.write(JSON.stringify(this.values));
    }
}