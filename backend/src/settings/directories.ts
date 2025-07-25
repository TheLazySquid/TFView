import { join, basename } from "node:path";
import os from "node:os";
import fsp from "node:fs/promises";
import Settings from "./settings";
import Server from "src/net/server";
import { Message, Recieves } from "$types/messages";
import type { GameDirectories } from "$types/data";
import { parse } from "vdf-parser";
import { exec } from "node:child_process";
import { dirpickerCommand, dirpickerPath } from "src/consts";
import Log from "src/log";

const tfPath = ["steamapps", "common", "Team Fortress 2", "tf"];

export default class Directories {
    static steamDir: string;
    static tfDir: string;
    static steamValid: boolean;
    static tfValid: boolean;

    static async init() {
        this.steamDir = Settings.get("steamPath");
        this.tfDir = Settings.get("tfPath");

        // Attempt to guess the Steam and TF2 directories
        if(!this.steamDir) {
            this.steamDir = process.platform === "win32" ?
                "C:\\Program Files (x86)\\Steam" :
                os.homedir() + "/.local/share/Steam";
        }

        if(!this.tfDir) {
            const libraryCfgPath = join(this.steamDir, "config", "libraryfolders.vdf");

            try {
                const libraryCfg = await fsp.readFile(libraryCfgPath);
                const vdf = parse<any>(libraryCfg.toString());
                
                for(let folder of Object.values<any>(vdf.libraryfolders)) {
                    if(Object.keys(folder.apps).includes("440")) {
                        this.tfDir = join(folder.path, ...tfPath);
                        break;
                    }
                }

                if(!this.tfDir) this.tfDir = join(this.steamDir, ...tfPath);
            } catch {                
                this.tfDir = join(this.steamDir, ...tfPath);
            }
        }

        Settings.set("steamPath", this.steamDir);
        Settings.set("tfPath", this.tfDir);
        
        this.validateSteam().then((valid) => this.steamValid = valid);
        this.validateTf().then((valid) => this.tfValid = valid);

        Server.onConnect("directories", (reply) => {
            reply(Message.Directories, this.getDirectories());
        });

        Server.on(Recieves.UpdateDirectory, async (type, { ws }) => {
            const defaultPath = type === "steam" ? this.steamDir : this.tfDir;
            exec(`${dirpickerCommand} "${defaultPath}"`, { cwd: dirpickerPath }, async (err, stdout) => {
                if(err) {
                    Server.sendTo(ws, Message.Error, "Failed to open directory picker");
                    Log.error("Failed to open directory picker", err);
                    return;
                }

                let path = stdout.trim();
                if(!path) return;

                if(type === "steam") {
                    this.steamDir = path;
                    this.steamValid = await this.validateSteam();
                    Settings.set("steamPath", this.steamDir);
                } else {
                    this.tfDir = path;
                    this.tfValid = await this.validateTf();
                    Settings.set("tfPath", this.tfDir);
                }

                Server.send("directories", Message.Directories, this.getDirectories());
            });
        });
    }

    static getDirectories(): GameDirectories {
        return {
            steam: { path: this.steamDir, valid: this.steamValid },
            tf: { path: this.tfDir, valid: this.tfValid }
        }
    }

    static async validateSteam() {
        if(basename(this.steamDir) !== "Steam") return false;
        if(!await fsp.exists(this.steamDir)) return false;
        if(await this.missingChildren(this.steamDir, ["userdata", "config"])) return false;
        return true;
    }

    static async validateTf() {
        if(basename(this.tfDir) !== "tf") return false;
        if(!await fsp.exists(this.tfDir)) return false;
        if(await this.missingChildren(this.tfDir, ["tf2_misc_dir.vpk", "steam.inf"])) return false;
        return true;
    }

    static async missingChildren(dir: string, children: string[]) {
        for(let child of children) {
            if(!await fsp.exists(join(dir, child))) return true;
        }
        
        return false;
    }
}