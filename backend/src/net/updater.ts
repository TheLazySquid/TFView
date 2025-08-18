import { compiled, flags, isLinux, root } from "src/consts";
import { version } from "../../../package.json";
import unzip from "unzip-stream";
import { join } from "node:path";
import { Readable } from "node:stream";
import Log from "src/log";
import Server from "./server";
import { Message, Recieves } from "$types/messages";
import Values from "src/settings/values";
import fsp from "node:fs/promises";
import { spawn } from "node:child_process";
import { close } from "src/close";

interface UpdateInfo {
    url: string;
    version: string;
}

export default class Updater {
    static endpoint = "https://api.github.com/repos/TheLazySquid/TFView/releases/latest";
    static updateInfo: UpdateInfo | null = null;
    static checkFailed = false;
    static sentFailMessage = false;
    static gotResponse = false;

    static async init() {
        if(!compiled || flags.noUpdateCheck) return;
        
        Server.onConnect("global", (reply) => {
            if(this.checkFailed) {
                if(this.sentFailMessage) return;
                this.sentFailMessage = true;
                
                reply(Message.Error, "Failed to check for updates");
                return;
            }
            
            if(this.updateInfo && !this.gotResponse) {
                const change = `v${version} -> ${this.updateInfo.version}`;
                reply(Message.UpdateAvailable, change);
            }
        });

        Server.on(Recieves.WantsToUpdate, (choice) => {
            if(!this.updateInfo || this.gotResponse) return;
            this.gotResponse = true;

            if(choice === "skip") {
                Values.set("skippedVersion", this.updateInfo.version);
            } else if(choice === "now") {
                this.downloadUpdate(this.updateInfo.url);
            }
        });

        try {
            this.updateInfo = await this.checkForUpdate();
        } catch(e) {
            Log.error("Failed to check for updates", e);
        }
    }

    static async checkForUpdate(): Promise<UpdateInfo | null> {
        let res = await fetch(this.endpoint);
        if(!res.ok) throw new Error("Api request failed");

        let data = await res.json();
        if(Values.get("skippedVersion") === data.tag_name) return null;
        if(Bun.semver.order(data.tag_name, version) <= 0) return null;
    
        // Get the url of the asset that matches the current platform
        const suffix = isLinux ? "_linux.zip" : "_windows.zip";
        for(let asset of data.assets) {
            if(asset.name.endsWith(suffix)) {
                return {
                    url: asset.browser_download_url,
                    version: data.tag_name
                }
            }
        }

        throw new Error("No compatible asset found");
    }

    static async downloadUpdate(url: string) {
        let res = await fetch(url);
        const unzipper = unzip.Extract({ path: join(root, "updated") });

        // types are messed up https://github.com/DefinitelyTyped/DefinitelyTyped/discussions/65542
        Readable.fromWeb(res.body as any).pipe(unzipper);
        await new Promise((res) => unzipper.on("close", res));

        // Copy the new static directory
        const newStatic = join(root, "updated", "static");
        const oldStatic = join(root, "static");
        
        if(await fsp.exists(newStatic)) {
            await fsp.rm(oldStatic, { recursive: true, force: true });
            await fsp.rename(newStatic, oldStatic);
        }

        // Copy the executable, but don't replace the current one since it's still running
        const extension = isLinux ? "" : ".exe";
        const newExecutable = join(root, "updated", `tfview${extension}`);
        const newPath = join(root, `tfview_new${extension}`);
        await fsp.rename(newExecutable, newPath);

        // Copy the updater
        const newUpdater = join(root, "updated", `updater${extension}`);
        const oldUpdater = join(root, `updater${extension}`);
        
        if(await fsp.exists(newUpdater)) {
            await fsp.rm(oldUpdater, { force: true });
            await fsp.rename(newUpdater, oldUpdater);
        }

        // Remove the updated directory
        const updatedPath = join(root, "updated");
        await fsp.rm(updatedPath, { recursive: true, force: true });

        // Spawn the updater and kill the process
        close();
        spawn(oldUpdater, { cwd: root, detached: true, stdio: "ignore" }).unref();
    }
}