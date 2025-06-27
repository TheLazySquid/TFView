import { Recieves } from "$types/messages";
import Log from "src/log";
import Server from "src/net/server";
import { join, dirname } from "path";
import Settings from "src/settings/settings";
import fsp from "node:fs/promises";

export default class AutoexecCheck {
    static init() {
        Server.on(Recieves.GetRconPassword, async (mastercomfig, { reply }) => {
            let password = Settings.get("rconPassword");
            if(password) return reply(password);

            password = await this.getRconPassword(mastercomfig);
            if(!password) password = Settings.randomPassword();
            Settings.set("rconPassword", password);

            reply(password);
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