import { Recieves } from "$types/messages";
import Log from "src/log";
import Server from "src/net/server";
import { join, dirname } from "path";
import Settings from "src/settings/settings";
import { kill } from "node:process";
import { parse, stringify } from "vdf-parser";
import { getCurrentUserId } from "src/util";
import fsp from "node:fs/promises";
import find from "find-process";

export default class Setup {
    static options = ["-condebug", "-conclearlog", "-usercon", "-g15"];

    static init(onComplete: () => void) {
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

        Server.on(Recieves.GetRconPassword, async (mastercomfig, { reply }) => {
            let password = Settings.get("rconPassword");
            if(password) return reply(password);

            password = await this.getRconPassword(mastercomfig);
            if(!password) password = Settings.randomPassword();
            Settings.set("rconPassword", password);

            reply(password);
        });

        Server.on(Recieves.SetRconPassword, (password) => {
            Settings.set("rconPassword", password);
        });

        Server.on(Recieves.CheckAutoexec, async (mastercomfig, { reply }) => {
            reply(await this.checkCfg(mastercomfig));
        });

        Server.on(Recieves.ApplyAutoexec, async (mastercomfig, { reply }) => {
            try {
                await this.autoApplyAutoexec(mastercomfig);
                reply(true);
            } catch(e) {
                Log.error("Failed to apply autoexec", e);
                reply(false);
            }
        });

        Server.once(Recieves.FinishSetup, () => {
            Log.info("Setup finished, starting TFView");
            onComplete();
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
        const game = vdf.UserLocalConfigStore.Software.Valve.steam.apps["440"];

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

    static getAutoexec(mastercomfig: boolean) {
        if(!Settings.get("tfPath")) return;

        if(mastercomfig) {
            return join(Settings.get("tfPath"), "cfg", "overrides", "autoexec.cfg");
        } else {
            return join(Settings.get("tfPath"), "cfg", "autoexec.cfg");
        }
    }

    static async getAutoexecLines(mastercomfig: boolean) {
        const path = this.getAutoexec(mastercomfig);
        if(!path || !await fsp.exists(path)) return [];

        const autoexec = await fsp.readFile(path);
        return autoexec.toString().replaceAll("\r\n", "\n").split("\n");
    }

    static async getRconPassword(mastercomfig: boolean) {
        const lines = await this.getAutoexecLines(mastercomfig);
        if(!lines) return;

        for(let line of lines) {
            if(line.startsWith("rcon_password")) {
                return line.replace("rcon_password", "").trim();
            }
        }
    }

    static async checkCfg(mastercomfig: boolean) {
        const lines = await this.getAutoexecLines(mastercomfig);
        if(!lines) return false;

        for(let line of lines) {
            if(line.startsWith("rcon_password")) {
                let password = line.replace("rcon_password", "").trim();
                if(password !== Settings.get("rconPassword")) return false;
                break;
            }
        }

        if(!lines.includes("ip 0.0.0.0")) return false;
        if(!lines.includes("net_start")) return false;
        return true;
    }

    static async autoApplyAutoexec(mastercomfig: boolean) {
        const valid = await this.checkCfg(mastercomfig);
        if(valid) return;

        const path = this.getAutoexec(mastercomfig);
        const lines = await this.getAutoexecLines(mastercomfig);
        
        // Add missing lines at the end
        lines.push("", "// Inserted by TFView");
        if(!lines.includes("ip 0.0.0.0")) lines.push("ip 0.0.0.0");
        const rconLine = `rcon_password ${Settings.get("rconPassword")}`;
        if(!lines.includes(rconLine)) lines.push(rconLine);

        // Always needs to be at the end, I think
        lines.push("net_start");

        const dir = dirname(path);
        fsp.mkdir(dir, { recursive: true });

        await fsp.writeFile(path, lines.join("\n"));
    }
}