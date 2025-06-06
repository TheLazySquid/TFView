import fs from "node:fs";
import { join } from "node:path";
import Dirs from "./dirs";
import { parse, stringify } from "vdf-parser";
import { ipcMain } from "electron";
import { send } from "./window";
import { kill } from "node:process";
import find from "find-process";

export default class LaunchOptions {
    static options = ["-condebug", "-conclearlog", "-usercon", "-g15"];

    static init() {
        ipcMain.handle("checkLaunchOptions", () => {
            let string = this.read();
            if(!string) return false;
            let parts = string.split(" ");

            for(let option of this.options) {
                if(!parts.includes(option)) return false;
            }

            return true;
        });

        ipcMain.handle("applyLaunchOptions", async () => {
            return await this.autoApply();
        });
    }

    static getConfigPath() {
        try {
            const userdata = join(Dirs.steamDir, "userdata");
            const users = fs.readdirSync(userdata);

            let lastModified = 0;
            let path: string | null = null;

            // Get the most recent config
            for(let user of users) {
                const configPath = join(userdata, user, "config", "localconfig.vdf");
                if(!fs.existsSync(configPath)) continue;
                const stat = fs.statSync(configPath);

                if(stat.mtimeMs > lastModified) {
                    lastModified = stat.mtimeMs;
                    path = configPath;
                }
            }

            return path;
        } catch (e) {
            console.error(e);
            send("error", "Failed to locate file with launch options");
            return null;
        }
    }

    static read(): string | undefined {
        const path = this.getConfigPath();
        if(!path) return;

        const vdf = parse<any>(fs.readFileSync(path).toString());
        const game = vdf.UserLocalConfigStore.Software.Valve.steam.apps["440"];

        return game.LaunchOptions;
    }

    static async autoApply() {
        let path = this.getConfigPath();
        if(!path) return false;

        const vdf = parse<any>(fs.readFileSync(path).toString());
        const game = vdf.UserLocalConfigStore.Software.Valve.steam.apps["440"];
        
        if(game.LaunchOptions) {
            let parts = game.LaunchOptions.split(" ");
            for(let option of this.options) {
                if(!parts.includes(option)) {
                    parts.push(option);
                }
            }
            game.LaunchOptions = parts.join(" ");
        } else {
            game.LaunchOptions = this.options.join(" ");
        }

        fs.writeFileSync(path, stringify(vdf));

        // kill steam so that the changes are applied
        // Tested on both windows and linux, which was a massive pain
        let processes = await find("name", "steam", true);
        for(let process of processes) {
            kill(process.pid);
        }

        return true;
    }
}