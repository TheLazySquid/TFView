import Settings from "$src/settings/settings";
import { join } from "node:path";
import { watch, type FSWatcher } from "chokidar";
import { readFile } from "node:fs/promises";
import Log from "$src/log";
import EventEmitter from "node:events";

interface MutesEvents {
    change: [];
}

export default class Mutes {
    static voiceBansPath: string;
    static mutedIds = new Set<string>();
    static events = new EventEmitter<MutesEvents>();

    static async init() {
        this.voiceBansPath = join(Settings.get("tfPath"), "voice_ban.dt");
        this.watchVoiceBans();

        Settings.on("tfPath", (path) => {
            this.voiceBansPath = join(path, "voice_ban.dt");
            this.watchVoiceBans();
        });
    }

    static isMuted(id3: string) {
        return this.mutedIds.has(id3);
    }

    static watcher?: FSWatcher;
    static async watchVoiceBans() {
        this.watcher?.close();

        this.watcher = watch([], {
            persistent: false,
            ignoreInitial: true
        });

        this.watcher.add(this.voiceBansPath);
        this.watcher.on("change", () => {
            Log.info("voice_ban.dt changed");
            this.readVoiceBans();
        });
        this.readVoiceBans();
    }

    static async readVoiceBans() {
        try {
            const data = await readFile(this.voiceBansPath);
            this.mutedIds.clear();

            // Read the file in 32 byte chunks ignoring 4 mystery bytes at the start
            for(let i = 4; i < data.length; i += 32) {
                const id3 = data.subarray(i, i + 32).toString().replace(/\0/g, "");
                const id3Short = id3.slice(5, -1);
                this.mutedIds.add(id3Short);
            }

            this.events.emit("change");
        } catch(e) {
            Log.error("Failed to read voice bans:", e);
        }
    }
}