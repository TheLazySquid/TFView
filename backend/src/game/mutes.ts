import Settings from "$src/settings/settings";
import { join } from "node:path";
import { watch, type FSWatcher } from "chokidar";
import { readFile } from "node:fs/promises";
import Log from "$src/log";
import Server from "../net/server";
import { Message } from "$types/messages";
import { flags } from "$src/consts";
import { fakeMutedIds } from "$src/fakedata/game";

export default class Mutes {
    static voiceBansPath: string;
    static mutedIds: string[] = flags.fakeData ? fakeMutedIds : [];

    static async init() {
        Server.onConnect("playermeta", (respond) => {
            respond(Message.MutedIds, this.mutedIds);
        });

        if(flags.fakeData) return;
        this.voiceBansPath = join(Settings.get("tfPath"), "voice_ban.dt");
        this.watchVoiceBans();

        Settings.on("tfPath", (path) => {
            this.voiceBansPath = join(path, "voice_ban.dt");
            this.watchVoiceBans();
        });
    }

    static watcher?: FSWatcher;
    static async watchVoiceBans() {
        this.watcher?.close();

        this.watcher = watch([], {
            persistent: false,
            ignoreInitial: true
        });

        this.watcher.add(this.voiceBansPath);
        this.watcher.on("change", this.readVoiceBans.bind(this));
        this.readVoiceBans();
    }

    static async readVoiceBans() {
        try {
            const data = await readFile(this.voiceBansPath);
            const newMutedIds: string[] = [];
            
            // Read the file in 32 byte chunks ignoring 4 mystery bytes at the start
            for(let i = 4; i < data.length; i += 32) {
                const id3 = data.subarray(i, i + 32).toString().replace(/\0/g, "");
                const id3Short = id3.slice(5, -1);
                newMutedIds.push(id3Short);
            }

            this.mutedIds = newMutedIds;
            Server.send("playermeta", Message.MutedIds, this.mutedIds);
        } catch(e) {
            Log.error("Failed to read voice bans:", e);
        }
    }
}