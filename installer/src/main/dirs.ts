import { ipcMain, dialog } from "electron";
import os from "node:os";
import fs from "node:fs";
import { join, basename } from "node:path";
import { parse } from "vdf-parser";

const tfPath = ["steamapps", "common", "Team Fortress 2", "tf"];

export default class Dirs {
    static steamDir: string;
    static tfDir: string;
    static steamValid: boolean;
    static tfValid: boolean;

    static init() {
        this.steamDir = process.platform === "win32" ?
            "C:\\Program Files (x86)\\Steam" :
            os.homedir() + "/.local/share/Steam";
        this.tfDir = join(this.steamDir, ...tfPath);
        
        // Attempt to automatically determine where the tf folder is
        this.steamValid = this.checkSteamValid();
        if(this.steamValid) this.autofillTf();
        else this.tfValid = this.checkTfValid();

        ipcMain.handle("getDirs", () => this.getState());
        ipcMain.handle("pickDir", this.pickDir.bind(this));
    }

    static autofillTf() {
        try {
            // Read where the games are installed
            const libraryCfg = fs.readFileSync(join(this.steamDir, "config", "libraryfolders.vdf")).toString();
            const vdf = parse<any>(libraryCfg);
            
            for(let folder of Object.values<any>(vdf.libraryfolders)) {
                if(Object.keys(folder.apps).includes("440")) {
                    this.tfDir = join(folder.path, ...tfPath);
                    this.tfValid = this.checkTfValid();
                    break;
                }
            }
        } catch(e) { console.error(e) }
    }

    static getState() {
        return {
            steam: this.steamDir, steamValid: this.steamValid,
            tf: this.tfDir, tfValid: this.steamValid
        }
    }

    static checkSteamValid() {
        if(basename(this.steamDir) !== "Steam") return false;
        if(!fs.existsSync(this.steamDir)) return false;
        if(this.checkMissingChildren(this.steamDir, ["userdata", "config"])) return false;
        return true;
    }

    static checkTfValid() {
        if(basename(this.tfDir) !== "tf") return false;
        if(!fs.existsSync(this.tfDir)) return false;
        if(this.checkMissingChildren(this.tfDir, ["tf2_misc_dir.vpk", "steam.inf"])) return false;
        return true;
    }

    static checkMissingChildren(dir: string, children: string[]) {
        for(let child of children) {
            if(!fs.existsSync(join(dir, child))) return true;
        }
        
        return false;
    }

    static async pickDir(_: any, type: string) {
        if(type === "steam") await this.pickSteamDir();
        else await this.pickTfDir();
        return this.getState();
    }

    static async pickSteamDir() {
        let res = await dialog.showOpenDialog({
            title: "Select Steam Directory",
            properties: ["openDirectory"]
        })

        if(res.canceled) return;
        this.steamDir = res.filePaths[0];
        this.steamValid = this.checkSteamValid();
        if(this.steamValid && !this.tfValid) this.autofillTf();
    }

    static async pickTfDir() {
        let res = await dialog.showOpenDialog({
            title: "Select TF2 Directory",
            properties: ["openDirectory"]
        })

        if(res.canceled) return;
        this.tfDir = res.filePaths[0];

        // Accept anything up the chain from tf
        const path = ["Steam", "steamapps", "common", "Team Fortress 2", "tf"];
        for(let i = 0; i < path.length - 1; i++) {
            if(basename(this.tfDir) === path[i]) {
                this.tfDir = join(this.tfDir, path[i + 1]);
            }
        }
        this.tfValid = this.checkTfValid();
    }
}