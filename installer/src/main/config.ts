import { join } from "node:path";
import Dirs from "./dirs";
import fs from "fs";
import { ipcMain } from "electron";
import { dirname } from "node:path";

export default class Config {
    static password: string | null = null;
    static mastercomfig = false;

    static init() {
        ipcMain.on("setRconInfo", (_, info: { mastercomfig: boolean, password: string }) => {
            this.password = info.password;
            this.mastercomfig = info.mastercomfig;
        });

        ipcMain.handle("getRconInfo", () => {
            if(this.password === null) this.password = this.getRconPassword();
            return {
                password: this.password,
                mastercomfig: this.mastercomfig,
                valid: this.checkCfg()
            }
        });

        ipcMain.handle("checkCfg", () => {
            return this.checkCfg();
        });

        ipcMain.on("applyCfgChanges", () => {
            this.autoApply();
        });
    }

    static getAutoexec(mastercomfig = false) {
        if(mastercomfig) {
            return join(Dirs.tfDir, "cfg", "overrides", "autoexec.cfg");
        } else {
            return join(Dirs.tfDir, "cfg", "autoexec.cfg");
        }
    }

    static getCfgLines() {
        const path = this.getAutoexec();
        if(!fs.existsSync(path)) return null;

        let autoexec = fs.readFileSync(path).toString();
        return autoexec.replaceAll("\r\n", "\n").split("\n");
    }

    static randomPassword() {
        // I'm lazy
        return Math.random().toString(36).slice(2);    
    }

    static getRconPassword() {
        const lines = this.getCfgLines();
        if(!lines) return this.randomPassword();

        for(let line of lines) {
            if(line.startsWith("rcon_password")) {
                return line.replace("rcon_password", "").trim();
            }
        }

        return this.randomPassword();
    }

    static checkCfg() {
        const lines = this.getCfgLines();
        if(!lines) return false;

        for(let line of lines) {
            if(line.startsWith("rcon_password")) {
                let password = line.replace("rcon_password", "").trim();
                if(password != this.password) return false;
                break;
            }
        }

        if(!lines.includes("ip 0.0.0.0")) return false;
        if(!lines.includes("net_start")) return false;
        return true;
    }

    static autoApply() {
        const valid = this.checkCfg();
        if(valid) return;

        const path = this.getAutoexec();

        let text = "";
        if(fs.existsSync(path)) text = fs.readFileSync(path).toString();

        text += "\n\n// Inserted by TFView\nip 0.0.0.0\n"
            + `rcon_password ${this.password}\nnet_start`;

        const dir = dirname(path);
        if(!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(path, text);
    }
}