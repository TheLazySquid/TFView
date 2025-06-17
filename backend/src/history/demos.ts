import Settings from "src/settings/settings";
import { join } from "node:path";
import { watch } from "node:fs";
import fsp from "node:fs/promises";
import Log from "src/log";
import { EventEmitter } from "node:events";

export default class Demos {
    static demosPath: string;
    static pollInterval = 5000;
    static events = new EventEmitter();
    static recentDemos: string[] = [];

    static init() {
        this.demosPath = join(Settings.get("tfPath"), "demos");
        this.watchDemos();
    }

    static watchDemos() {
        try {
            watch(this.demosPath, null, async (event, file) => {
                const name = file.toString();
                if(event === "change" || !name.endsWith(".dem")) return;

                let exists = await fsp.exists(join(this.demosPath, name));
                if(!exists) return;
                
                // fs.watch often fires multiple times for the same file
                if(this.recentDemos.includes(name)) return;

                this.recentDemos.push(name);
                if(this.recentDemos.length > 10) this.recentDemos.shift();

                Log.info("Demo created: ", name);
                this.events.emit("create", name);
            });
        } catch {
            setTimeout(() => this.watchDemos(), this.pollInterval);
        }
    }
}

await Settings.init();
Demos.init();