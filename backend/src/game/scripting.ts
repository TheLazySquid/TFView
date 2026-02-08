import LogParser from "./logParser";
import Log from "src/log";
import { join } from "path";
import { dataPath } from "src/consts";
import type { ScriptContext } from "$types/scripting";
import Server from "src/net/server";
import { Message } from "$types/messages";
import Settings from "src/settings/settings";

export default class Scripting {
    static execRegex = /(?:\n|^)tfview\.(\w+)\s*\((.*)\)\s*(?=\n|$)/g;
    static init() {
        LogParser.on(this.execRegex, (match) => {
            const [, script, arg] = match;
            this.runScript(script, arg);
        });
    }

    static async runScript(script: string, arg: string) {
        // Allow for both .js and .ts imports
        const path = join(dataPath, "scripts", script);
        const context = this.createContext(script);

        try {
            const exports = await import(`${path}?t=${Date.now()}`);
            exports.main?.call(null, arg, context);
        } catch(e) {
            Log.warning(`Error running script ${script}`, e);
        }
    }

    static createContext(script: string): ScriptContext {
        return {
            toast: {
                success: (message: string) => Server.send("global", Message.Success, message),
                warning: (message: string) => Server.send("global", Message.Warning, message),
                error: (message: string) => Server.send("global", Message.Error, message)
            },
            log: {
                info: (...messages: string[]) => Log.info(`[${script}]`, ...messages),
                warning: (...messages: string[]) => Log.warning(`[${script}]`, ...messages),
                error: (...messages: string[]) => Log.error(`[${script}]`, ...messages)
            },
            get tfPath() { return Settings.get("tfPath") },
            get steamPath() { return Settings.get("steamPath") }
        }
    }
}