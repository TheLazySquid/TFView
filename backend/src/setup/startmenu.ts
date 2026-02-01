import fsp from "node:fs/promises";
import { join } from "node:path";
import { root } from "src/consts";
import { exec } from "node:child_process";
import Server from "src/net/server";
import { Message, Recieves } from "$types/messages";
import Settings from "src/settings/settings";
import { feature } from "bun:bundle";

export default class StartMenu {
    static startMenuPath = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs';
    static linkPath = join(this.startMenuPath, "TFView.lnk");

    static init() {
        if(!feature("COMPILED") || process.platform !== "win32" || Settings.get("pickedIfShortcut")) return;
        
        let existsPromise = this.check();
        Server.onConnect("global", async (reply) => {
            if(Settings.get("pickedIfShortcut")) return;

            if(await existsPromise) return;
            reply(Message.OfferStartMenuShortcut, undefined);
        });

        Server.on(Recieves.WantsStartMenuShortcut, async (wants, { ws }) => {
            if(wants) {
                this.createShortcut()
                    .then(() => {
                        Server.sendTo(ws, Message.Success, "Start menu shortcut created successfully");
                        Settings.set("pickedIfShortcut", true);
                    })
                    .catch(() => Server.sendTo(ws, Message.Error, "Failed to create start menu shortcut"));
            } else {
                Settings.set("pickedIfShortcut", true);
            }
        });
    }

    static check() {
        return fsp.exists(this.linkPath);
    }

    static createShortcut() {
        return new Promise<void>((res, rej) => {
            const commands = [
                "$shell = New-Object -ComObject WScript.Shell",
                `$shortcut = $shell.CreateShortcut("${this.linkPath}")`,
                `$shortcut.TargetPath = "${join(root, "tfview.exe")}"`,
                `$shortcut.IconLocation = "${join(root, "static", "icon.ico")}"`,
                `$shortcut.Save()`
            ]
    
            const argumentList = commands.join("; ").replaceAll('"', "''");
            const command = `powershell -Command "Start-Process powershell -Verb runAs -WindowStyle Hidden -Wait -ArgumentList '${argumentList}'"`;
            
            // There isn't really a good way to tell if this worked from the command
            exec(command, async () => {
                let exists = await this.check();

                if(exists) res();
                else rej();
            });
        })
    }
}