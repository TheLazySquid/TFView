import Settings from "$src/settings/settings";
import { join } from "node:path";
import fsp from "node:fs/promises";
import fs from "node:fs";
import Log from "$src/log";
import { EventEmitter } from "node:events";
import Rcon from "$src/game/rcon";
import { flags } from "$src/consts";
import Server from "$src/net/server";
import { Recieves } from "$types/messages";
import Close from "$src/close";
import { watch, type FSWatcher } from "chokidar";
import { basename } from "node:path";
import { exists } from "$src/util";

interface DemosEvents {
    create: [demo: string];
}

export default class Demos {
    static demosPath: string | null = null;
    static events = new EventEmitter<DemosEvents>();

    static init() {
        const tfPath = Settings.get("tfPath");
        if(tfPath) {
            this.demosPath = join(tfPath, "demos");
            this.watchDemos();
        }

        Settings.on("tfPath", (path) => {
            this.demosPath = join(path, "demos");
            this.watchDemos();
        });

        Server.on(Recieves.PlayDemo, async (demo: string, { reply }) => {
            const success = await this.playDemo(demo);
            reply(success);
        });
    }

    static watcher?: FSWatcher;
    static watchDemos() {
        this.watcher?.close();
        if(!this.demosPath) return;

        this.watcher = watch(this.demosPath, {
            ignored: (file, stat) => Boolean(stat?.isFile() && !file.endsWith(".dem")),
            persistent: false,
            ignoreInitial: true,
            depth: 1
        });

        this.watcher.on("add", (path) => {
            const file = basename(path);
            Log.info("Demo created:", file);
            this.events.emit("create", file);
        });
    }

    static async playDemo(demo: string) {
        if(!this.demosPath) return false;

        const path = join(this.demosPath, demo);
        if(!await exists(path)) {
            Log.error("Demo not found:", path);
            return false;
        }

        Rcon.run(`playdemo demos/${demo}`);
        return true;
    }
}