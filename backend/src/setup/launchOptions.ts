import { Recieves } from "$types/messages";
import Log from "src/log";
import Server from "src/net/server";
import { join } from "path";
import Settings from "src/settings/settings";
import { getCurrentUserId } from "src/util";
import fsp from "node:fs/promises";
import { parse, stringify } from "vdf-parser";
import { kill } from "node:process";
import find from "find-process";

export default class LaunchOptionsCheck {
    static options = ["-condebug", "-conclearlog", "-usercon", "-g15"];

    static init() {
        Server.on(Recieves.CheckLaunchOptions, async (_, { reply }) => {
            let string = await this.readLaunchOptions();
            if(!string) return reply(false);
    
            let parts = string.split(" ");
    
            for(let option of this.options) {
                if(!parts.includes(option)) return reply(false);
            }
    
            return reply(true);
        });
    
        Server.on(Recieves.ApplyLaunchOptions, async (_, { reply }) => {
            try {
                this.autoApplyLaunchOptions();
                reply(true);
            } catch(e) {
                Log.error("Failed to apply launch options", e);
                reply(false);
            }
        });
    }

    static async getConfigPath() {
        let userId = await getCurrentUserId();
        if(!userId) return;

        return join(Settings.get("steamPath"), "userdata", userId, "config", "localconfig.vdf");
    }

    static async readLaunchOptions() {
        const path = await this.getConfigPath();
        if(!path || !await fsp.exists(path)) return;

        const config = await fsp.readFile(path);
        const vdf = parse<any>(config.toString());
        const valve = vdf.UserLocalConfigStore.Software.Valve;
        const steam = valve.steam ?? valve.Steam;
        const game = steam.apps["440"];

        return game.LaunchOptions;
    }

    static async autoApplyLaunchOptions() {
        const path = await this.getConfigPath();
        const config = await fsp.readFile(path);

        const vdf = parse<any>(config.toString());
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

        await fsp.writeFile(path, stringify(vdf));

        // kill steam so that the changes are applied
        // Tested on both windows and linux, which was a massive pain
        let processes = await find("name", "steam", true);
        for(let process of processes) {
            kill(process.pid);
        }

        return true;
    }
}